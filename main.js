const langs = ["en", "ja", "jbo", "eo"];

const gismuRegex =
  /^([bcdfghjklmnprstvxz][aeiou][bcdfghjklmnprstvxz][bcdfghjklmnprstvxz][aeiou]|[bcdfghjklmnprstvxz][bcdfghjklmnprstvxz][aeiou][bcdfghjklmnprstvxz][aeiou])$/;

const wordTypes = [
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
];

function setDark(dark) {
  const sunOrMoon = dark ? "moon" : "sun";
  const colorSchemeIcon = `<i class="fa-solid fa-fw fa-${sunOrMoon}"></i>`;
  document.getElementById("lightswitch").innerHTML = colorSchemeIcon;
  document.body.className = dark ? "dark" : "";
  localStorage.setItem("theme", dark ? "dark" : "light");
}

function getLujvoParts(word) {
  const old = console.log;
  console.log = () => {};
  const parts = jvokaha(word);
  console.log = old;
  return parts
    .filter((x) => x.length > 1)
    .map((rafsi) => search_selrafsi_from_rafsi2(rafsi) ?? `-${rafsi}-`);
}

window.addEventListener("DOMContentLoaded", () => {
  let lang = "en";
  let interval = undefined;

  const theme =
    localStorage.getItem("theme") ??
    (window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light");
  setDark(theme === "dark");
  setTimeout(() => {
    document.body.style.transition = "color 0.2s,background-color 0.2s";
  }, 0);
  document.getElementById("lightswitch").addEventListener("click", () => {
    setDark(document.body.className !== "dark");
  });
  const search = document.getElementById("search");
  const lujvoResult = document.getElementById("lujvo_result");
  document.getElementById("clear").addEventListener("click", () => {
    search.value = "";
    go();
    search.focus();
  });

  function go() {
    window.scrollTo(0, 0);
    const trimmed = search.value.trim();
    lujvoResult.innerHTML = "";
    if (!trimmed) {
      document.getElementById("results").replaceChildren();
      window.history.replaceState(null, null, "?" + lang);
      return;
    }
    window.history.replaceState(null, null, "?" + lang + "#" + trimmed);
    const noU2019 = trimmed.replaceAll("’", "'");
    const natural = noU2019.replace(/[^\s\p{L}\d']/gu, "").toLowerCase();
    const apostrophized = natural.replaceAll("h", "'");
    const words = natural.split(/\s+/);
    const specialPatterns = { 
      ja: "abcdefgijklmnoprstuvxyz'".includes(natural.charAt(0)) 
        ? undefined 
        : natural,
      en: `(^|[^a-z'#])(${natural}(es|s)?)(?=$|[^a-z'])`, 
      eo: `(^|[^a-zĉĝĥĵŝŭ'#])(${natural})(?=$|[^a-zĉĝĥĵŝŭ'])` 
    };
    const full = new RegExp(
      specialPatterns[lang] ?? `(^|[^a-z'#])(${natural})(?=$|[^a-z'])`, "ui"
    );
    const x1isMatch = new RegExp(
      "1\\}?\\$ (is (a |[$x2_{} ]+|[a-z/ ]+)?)?" + natural
    );
    let lujvoParts = [];
    let results = [];
    const isSelmahoQuery =
      /^[A-Zh0-9*]+$/.test(trimmed) && !/^[?*VC]+$/.test(trimmed);
    const isGlob = /[?*VC]/.test(trimmed);
    if (!isSelmahoQuery && !isGlob) {
      if (words.length === 1) {
        const selrafsi = search_selrafsi_from_rafsi2(apostrophized);
        if (selrafsi) {
          lujvoResult.innerHTML = "← " + selrafsi;
        } else {
          try {
            lujvoParts = getLujvoParts(apostrophized);
            lujvoResult.innerHTML = "← " + lujvoParts.join(" ");
          } catch (e) {
            lujvoParts = [];
            lujvoResult.innerHTML = "";
          }
        }
      } else if (words.length > 1) {
        try {
          const lujvo = jvozba(words).filter((x) => /[aeiou]$/.test(x.lujvo));
          lujvoResult.innerHTML = "→ " + lujvo[0].lujvo;
          words.unshift(lujvo[0].lujvo);
        } catch (e) {
          lujvoResult.innerHTML = "";
        }
      }
    }
    let globRe = undefined;
    if (isGlob) {
      const reBody = trimmed
        .replaceAll("V", "[aeiou]")
        .replaceAll("C", "[bcdfgjklmnprstvxz]")
        .replaceAll("?", ".")
        .replaceAll(/\*+/g, ".*");
      globRe = new RegExp("^" + reBody + "$", "i");
    }
    for (const entry of jvs) {
      const [lemma, type, definition, notes] = entry;
      let score = 0;
      let i = -1;
      let j = -1;
      if (lemma.length > 70) continue; // joke words
      const inLemma =
        !isGlob && (lemma.includes(natural) || lemma.includes(apostrophized));
      const matches = isSelmahoQuery
        ? typeof type === "string" &&
          (trimmed === type || trimmed === type.replaceAll(/[\d*]/g, ""))
        : isGlob
        ? globRe.test(lemma)
        : (i = words.indexOf(lemma)) > -1 ||
          (j = lujvoParts.indexOf(lemma)) > -1 ||
          inLemma ||
          full.test(definition) ||
          full.test(notes);
      if (matches) {
        if (isSelmahoQuery) {
          score = /\*/.test(type) ? 70000 : 71000;
        } else if (i > -1) {
          score = 90000 - i;
        } else if (j > -1) {
          score = 80000 - j;
        } else {
          if (definition.length > 400) score -= 100;
          if (type >= 9 && type <= 13) score -= 100; // obsolete
          if (inLemma) score += 5;
          if (x1isMatch.test(definition)) score += 7;
          if (lemma === natural || lemma === apostrophized) score += 100;
          if (full.test(lemma)) score += 8;
          if (full.test(definition)) score += 8;
          if (full.test(notes)) score += 4;
          if (gismuRegex.test(lemma)) score += type === 5 ? 1 : 5;
        }
        results.push([score, entry]);
      }
    }
    results.sort((a, b) => b[0] - a[0]);
    if (!isSelmahoQuery && results.length > 100) {
      results.length = 100;
    }
    document.getElementById("results").replaceChildren(
      ...results.flatMap((e) => {
        const dt = document.createElement("dt");
        const [lemma, type, definition, notes] = e[1];
        const rafsi =
          gismu_rafsi_list$(lemma) ?? cmavo_rafsi_list$(lemma) ?? [];
        const obsolete = type >= 10 && type <= 13;
        let extra =
          (type === 4 || type === 5 ? "*" : "") +
          (rafsi.length ? " → " + rafsi.join(" ") : "");
        const lemmaLink = document.createElement("a");
        lemmaLink.href = "#" + lemma;
        lemmaLink.appendChild(document.createTextNode(lemma));
        if (obsolete) {
          lemmaLink.className = "obsolete";
        }
        dt.appendChild(lemmaLink);
        if (extra) {
          const i = document.createElement("i");
          i.appendChild(document.createTextNode(extra));
          dt.appendChild(i);
        }
        if (typeof type === "string") {
          const a = document.createElement("a");
          a.className = "selmaho";
          a.href = "#" + type;
          a.appendChild(document.createTextNode(type));
          dt.appendChild(a);
        }
        const jvs = document.createElement("a");
        jvs.href = "https://jbovlaste.lojban.org/dict/" + lemma;
        jvs.target = "_blank";
        jvs.rel = "noopener noreferrer";
        jvs.innerHTML = '<i class="fa-solid fa-square-arrow-up-right"></i>';
        dt.appendChild(jvs);
        const dd = document.createElement("dd");
        dd.appendChild(document.createTextNode(definition));
        if (notes) {
          const brSpan = document.createElement("span");
          brSpan.innerHTML = "<br />"
          brSpan.hidden = true;
          dd.appendChild(brSpan);
          const noteButton = document.createElement("button");
          noteButton.innerHTML = '<i class="fa-solid fa-note-sticky"></i>';
          noteButton.className = "noteswitch";
          dd.appendChild(noteButton);
          const noteSpan = document.createElement("span");
          noteSpan.appendChild(document.createTextNode(notes));
          noteSpan.innerHTML = noteSpan.innerHTML.replace(
            /\{([a-z']+)\}/g, 
            (_, w) => `{<a href="#${w}">${w}</a>}`
          );
          noteSpan.hidden = true;
          dd.appendChild(noteSpan);
        }
        if (!isGlob && !isSelmahoQuery)
          dd.innerHTML = dd.innerHTML.replace(full, "$1<mark>$2</mark>");
        dd.innerHTML = dd.innerHTML.replace(
          /([\$=])([A-Za-z]+)_?\{?([n\d+])\}?\$?/g,
          (_, v, w, d) => `${v === "=" ? "=" : ""}<i>${w}</i><sub>${d}</sub>`
        );
        return [dt, dd];
      })
    );
    for (const e of document.getElementsByClassName("noteswitch")) {
      e.addEventListener("click", () => {
        const isHidden = !e.parentElement.lastChild.hidden
        e.style.marginTop = isHidden ? "" : "5px";
        for (const sp of e.parentElement.getElementsByTagName("span")) {
          sp.hidden = isHidden;
        };
      });
    }
  }
  function setSearchFromHistory() {
    return (search.value = decodeURIComponent(
      location.href.split("#")[1] || ""
    ));
  }
  function setLang(newLang) {
    const query = setSearchFromHistory();

    lang = langs.includes(newLang) ? newLang : "en";
    window.history.replaceState(null, null, "?" + lang);
    localStorage.setItem("lang", lang);
    search.placeholder = "loading...";
    search.disabled = true;
    fetch(`./jvs-${lang}.json`, {
      headers: { accept: "application/json; charset=utf8;" },
    })
      .then((res) => res.json())
      .then((data) => {
        jvs = data;
        search.value = query;
        search.placeholder = "sisyvla";
        search.disabled = false;
        go();
        search.focus();
      });
    for (const e of document.getElementsByClassName("lang")) {
      e.className =
        lang === e.attributes["data-lang"].value ? "lang active" : "lang";
    }
  }

  const fromParam = window.location.search.replace("?", "");
  setLang(fromParam ? fromParam : localStorage.getItem("lang") ?? "en");

  function goDebounced() {
    window.clearTimeout(interval);
    interval = window.setTimeout(go, 15);
  }
  search.addEventListener("keyup", goDebounced);
  search.addEventListener("paste", goDebounced);
  window.addEventListener("popstate", () => {
    setSearchFromHistory();
    go();
  });

  for (const e of document.getElementsByClassName("lang")) {
    e.addEventListener("click", () => {
      setLang(e.attributes["data-lang"].value);
    });
  }

  // if ("serviceWorker" in navigator) {
  //   let registration;
  //   const registerServiceWorker = async () => {
  //     registration = await navigator.serviceWorker.register(
  //       "./service-worker.js"
  //     );
  //   };
  //   registerServiceWorker();
  // }
});
