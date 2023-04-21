import os, json
import xml.etree.ElementTree as ET

types = [
    "bu-letteral",
    "cmavo",
    "cmavo-compound",
    "cmevla",
    "experimental cmavo",
    "experimental gismu",
    "fu'ivla",
    "gismu",
    "lujvo",
    "nalvla",
    "obsolete cmavo",
    "obsolete cmevla",
    "obsolete fu'ivla",
    "obsolete zei-lujvo",
    "zei-lujvo",
]

for lang in ["en", "ja", "jbo", "eo"]:
    root = ET.parse(f"jbovlaste-{lang}.xml").getroot()
    data = []
    for valsi in root.iter("valsi"):
        word = valsi.get("word")
        selmaho = valsi.findtext("selmaho") or types.index(valsi.get("type"))
        definition = valsi.findtext("definition") or ""
        notes = valsi.findtext("notes") or ""
        data.append([word, selmaho, definition, notes])
    js = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
    with open(f"jvs-{lang}.json", "w") as f:
        f.write(js)
