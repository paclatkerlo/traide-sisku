import os, json
import xml.etree.ElementTree as ET
import latkerlo_jvotci

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
    "obsolete cmavo",
    "obsolete cmevla",
    "obsolete fu'ivla",
    "obsolete zei-lujvo",
    "zei-lujvo",
    "phrase",
]

for lang in ["en", "ja", "jbo", "eo"]:
    root = ET.parse(f"jbovlaste-{lang}.xml").getroot()
    data = []
    for valsi in root.iter("valsi"):
        word = valsi.findtext("word")
        ty = valsi.findtext("type")
        if ty == "nalvla": continue
        type_index = types.index(ty)
        selmaho = valsi.findtext("selmaho") or ""
        score = int(valsi.findtext("score") or "0")
        definition = valsi.findtext("definition") or ""
        notes = (valsi.findtext("notes") or "").strip()
        try:
            decomp = latkerlo_jvotci.get_veljvo(word)
        except:
            decomp = []
        word_data = [word, type_index, selmaho, score, definition, notes, decomp]
        data.append(json.dumps(word_data, ensure_ascii=False, separators=(',', ':')))
    if not data: raise Exception("no data found")
    js = f'[\n  {",\n  ".join(data)}\n]\n'
    with open(f"jvs-{lang}.json", "w") as f:
        f.write(js)
