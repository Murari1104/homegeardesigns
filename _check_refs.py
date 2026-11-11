import os
import re

root = os.path.dirname(os.path.abspath(__file__))
html = open(os.path.join(root, "index.html"), encoding="utf-8").read()
refs = re.findall(r'(?:src|href)="([^"]+)"', html)
missing = []
for ref in refs:
    if ref.startswith(("http", "#", "tel:", "mailto:")):
        continue
    path = ref.split("?")[0]
    fp = os.path.normpath(os.path.join(root, path.replace("/", os.sep)))
    if not os.path.isfile(fp):
        missing.append(ref)
print("refs", len(refs))
print("missing", missing)
