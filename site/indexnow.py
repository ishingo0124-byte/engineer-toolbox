"""IndexNow 通知（Bing など）。GitHub Actions のデプロイ後に動く。

  python site/indexnow.py <前のコミット> <今のコミット>

2つのコミットの差分から、変わったページの URL だけを送る。
鍵は site/root/<鍵>.txt（中身も鍵）。送る先は api.indexnow.org。
"""
import json, os, re, subprocess, sys, urllib.request

SITE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(SITE, "root")


def main():
    before, after = sys.argv[1], sys.argv[2]
    cfg = json.load(open(os.path.join(SITE, "config.json"), encoding="utf-8"))
    base = cfg["base_url"].rstrip("/")
    keys = [f[:-4] for f in os.listdir(ROOT) if re.fullmatch(r"[0-9a-f]{32}\.txt", f)]
    if not keys:
        print("indexnow: 鍵ファイルなし"); return
    key = keys[0]
    if re.fullmatch(r"0+", before or "0"):
        print("indexnow: 前のコミットなし"); return
    try:
        out = subprocess.run(["git", "diff", "--name-only", before, after], capture_output=True, text=True, check=True).stdout
    except subprocess.CalledProcessError as e:
        print("indexnow: git diff 失敗", e.stderr); return
    urls, top = [], False
    for f in out.splitlines():
        m = re.match(r"site/tools/([^/]+)/", f)
        if m:
            if os.path.isdir(os.path.join(SITE, "tools", m.group(1))):
                urls.append(f"{base}/tools/{m.group(1)}/")
            top = True
            continue
        m = re.match(r"site/pages/([^/]+)\.md$", f)
        if m:
            urls.append(f"{base}/{m.group(1)}/")
    if top:
        urls += [f"{base}/", f"{base}/tools/"]
    urls = sorted(set(urls))[:500]
    if not urls:
        print("indexnow: 送る URL なし"); return
    body = json.dumps({"host": re.sub(r"^https?://", "", base), "key": key,
                       "keyLocation": f"{base}/{key}.txt", "urlList": urls}).encode()
    req = urllib.request.Request("https://api.indexnow.org/indexnow", data=body,
                                 headers={"Content-Type": "application/json; charset=utf-8"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            print("indexnow:", r.status, len(urls), "件")
    except Exception as e:  # 通知の失敗でデプロイを失敗扱いにしない
        print("indexnow: 送信失敗", e)
    for u in urls:
        print(" ", u)


if __name__ == "__main__":
    main()
