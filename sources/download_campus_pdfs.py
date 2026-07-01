#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
מוריד את קובצי ה-PDF הרשמיים של Campus IL לפי הקטלוג ב-campus_pdf_catalog.csv,
ואופציונלית מוסיף אותם ישירות ל-repo (git add/commit/push).

חשוב: יש להריץ סקריפט זה בסביבה שבה יש גישה ל-courses.campus.gov.il ובה אתם
מחוברים (logged in) לקורס — למשל המחשב האישי שלכם. סביבת ההרצה של Claude חוסמת
את הדומיין הזה, ולכן ההורדה חייבת להתבצע אצלכם.

שימוש:
    python3 download_campus_pdfs.py            # הורדה בלבד -> sources/pdfs/
    python3 download_campus_pdfs.py --push     # הורדה + git add/commit/push (משלים את המטרה)

אם הקבצים דורשים התחברות, העבירו עוגייה (DevTools -> Network -> cookie):
    CAMPUS_COOKIE="sessionid=...; edxloggedin=true" python3 download_campus_pdfs.py --push
"""
import csv
import os
import subprocess
import sys
import time
from urllib.parse import unquote
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

HERE = os.path.dirname(os.path.abspath(__file__))
CATALOG = os.path.join(HERE, "campus_pdf_catalog.csv")
OUTDIR = os.path.join(HERE, "pdfs")
COURSE_REFERER = ("https://courses.campus.gov.il/courses/"
                  "course-v1:MSE+GOV_PsychometryHe+2018_1/")
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0 Safari/537.36")


def filename_from_url(url):
    return unquote(url.rstrip("/").split("/")[-1]) or "file.pdf"


def download_all():
    if not os.path.exists(CATALOG):
        sys.exit(f"לא נמצא קטלוג: {CATALOG}")
    os.makedirs(OUTDIR, exist_ok=True)
    cookie = os.environ.get("CAMPUS_COOKIE", "").strip()
    with open(CATALOG, encoding="utf-8") as fh:
        rows = [r for r in csv.DictReader(fh) if r.get("url")]

    ok, skipped, failed = 0, 0, []
    for i, r in enumerate(rows, 1):
        title, url = r["title"], r["url"]
        dest = os.path.join(OUTDIR, filename_from_url(url))
        if os.path.exists(dest) and os.path.getsize(dest) > 0:
            skipped += 1
            print(f"[{i}/{len(rows)}] קיים, מדלג: {title}")
            continue
        headers = {"User-Agent": UA, "Referer": COURSE_REFERER,
                   "Accept": "application/pdf,*/*"}
        if cookie:
            headers["Cookie"] = cookie
        try:
            with urlopen(Request(url, headers=headers), timeout=60) as resp:
                data = resp.read()
            if not data.startswith(b"%PDF"):
                failed.append((title, "התוכן שהתקבל אינו PDF (ככל הנראה דף התחברות)"))
                print(f"[{i}/{len(rows)}] לא PDF: {title}")
                continue
            with open(dest, "wb") as out:
                out.write(data)
            ok += 1
            print(f"[{i}/{len(rows)}] הורד ({len(data)//1024} KB): {title}")
        except HTTPError as e:
            failed.append((title, f"HTTP {e.code}"))
            print(f"[{i}/{len(rows)}] נכשל HTTP {e.code}: {title}")
        except URLError as e:
            failed.append((title, str(e.reason)))
            print(f"[{i}/{len(rows)}] נכשל: {title} ({e.reason})")
        time.sleep(0.5)  # פנייה מנומסת לשרת

    print("\n=== סיכום הורדה ===")
    print(f"הורדו: {ok} | קיימים: {skipped} | נכשלו: {len(failed)}")
    if failed:
        print("\nכשלונות (ייתכן שנדרשת עוגיית CAMPUS_COOKIE):")
        for title, why in failed:
            print(f"  - {title}: {why}")
    return ok, skipped, failed


def git_push():
    """מוסיף את sources/pdfs/ ל-repo ומבצע push. יש להריץ בתוך ה-clone של ה-repo."""
    try:
        root = subprocess.check_output(
            ["git", "rev-parse", "--show-toplevel"], cwd=HERE,
            text=True, stderr=subprocess.DEVNULL).strip()
    except Exception:
        print("\n[push] לא נמצא repo של git — דלגו על ה-push, "
              "או הריצו את הסקריפט בתוך ה-clone של JKern100/Tamar.")
        return
    n = len([f for f in os.listdir(OUTDIR) if f.lower().endswith(".pdf")])
    if n == 0:
        print("\n[push] אין קובצי PDF להעלאה — מדלג.")
        return
    print(f"\n[push] מוסיף {n} קובצי PDF ל-repo ומבצע push...")
    try:
        subprocess.check_call(["git", "add", "sources/pdfs/"], cwd=root)
        subprocess.check_call(
            ["git", "commit", "-m", f"Add {n} official Campus IL PDFs from catalogue"],
            cwd=root)
        subprocess.check_call(["git", "push"], cwd=root)
        print("[push] בוצע. הקבצים נמצאים כעת ב-repo.")
    except subprocess.CalledProcessError as e:
        print(f"[push] נכשל: {e}. אם זו שגיאת גודל קובץ (>100MB) — "
              "יש להשתמש ב-Git LFS עבור הקבצים הגדולים.")


def main():
    ok, skipped, failed = download_all()
    if "--push" in sys.argv or os.environ.get("PUSH"):
        if ok + skipped == 0:
            print("\n[push] לא הורד דבר — מדלג על push.")
        else:
            git_push()
    else:
        print("\nהקבצים נשמרו ל-sources/pdfs/. כדי להוסיף אותם ל-repo הריצו שוב עם --push,")
        print("או: git add sources/pdfs/ && git commit -m \"Add official PDFs\" && git push")


if __name__ == "__main__":
    main()
