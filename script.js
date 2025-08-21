document.addEventListener("DOMContentLoaded", () => {
  const dropdowns = document.querySelectorAll(".dropContainer");
  const inLang = document.querySelector("#inLang");
  const outLang = document.querySelector("#outLang");
  const swapBtn = document.querySelector(".swpBtn");
  const inSel = inLang.querySelector(".sel");
  const outSel = outLang.querySelector(".sel");
  const inTxt = document.querySelector("#inTxt");
  const outTxt = document.querySelector("#outTxt");
  const uploadInput = document.querySelector("#uploadDoc");
  const uploadTitle = document.querySelector("#upTtl");
  const downloadBtn = document.querySelector("#downloadBtn");
  const inChar = document.querySelector("#inChar");

  inTxt.focus();

  function populateDropdown(dropdown, options) {
    const list = dropdown.querySelector("ul");
    list.innerHTML = "";
    options.forEach((opt) => {
      const li = document.createElement("li");
      li.textContent = `${opt.name} (${opt.native})`;
      li.dataset.value = opt.code;
      li.classList.add("opt");
      list.appendChild(li);
    });
  }

  populateDropdown(inLang, languages);
  populateDropdown(outLang, languages);

  dropdowns.forEach((dropdown) => {
    dropdown.addEventListener("click", () => {
      dropdown.classList.toggle("active");
    });

    dropdown.querySelectorAll(".opt").forEach((item) => {
      item.addEventListener("click", () => {
        dropdown.querySelectorAll(".opt").forEach((opt) => opt.classList.remove("activeOpt"));
        item.classList.add("activeOpt");
        const selected = dropdown.querySelector(".sel");
        selected.innerHTML = item.innerHTML;
        selected.dataset.value = item.dataset.value;
        translate();
      });
    });
  });

  document.addEventListener("click", (e) => {
    dropdowns.forEach((dropdown) => {
      if (!dropdown.contains(e.target)) dropdown.classList.remove("active");
    });
  });

  function debounce(func, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => func.apply(this, args), delay);
    };
  }

  function translate() {
    const text = inTxt.value.trim();
    if (!text) {
      outTxt.value = "";
      return;
    }

    const from = inSel.dataset.value;
    const to = outSel.dataset.value;

    if (from === to && from !== "auto") {
      outTxt.value = text;
      return;
    }

    outTxt.value = "Translating...";

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Status: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        outTxt.value = json[0]?.map((line) => line[0]).join("") || "Translation error";
      })
      .catch(() => {
        outTxt.value = "Translation failed. Please try again.";
      });
    uploadTitle.innerHTML = "Choose File";
      
  }

  swapBtn.addEventListener("click", () => {
    if (inSel.dataset.value === "auto") {
      swapBtn.classList.add("swap-disabled");
      setTimeout(() => swapBtn.classList.remove("swap-disabled"), 500);
      return;
    }

    swapBtn.classList.add("swap-animation");
    setTimeout(() => swapBtn.classList.remove("swap-animation"), 300);

    // Swap language selections
    const tempLang = inSel.innerHTML;
    const tempVal = inSel.dataset.value;
    inSel.innerHTML = outSel.innerHTML;
    inSel.dataset.value = outSel.dataset.value;
    outSel.innerHTML = tempLang;
    outSel.dataset.value = tempVal;

    // Swap text
    const tempText = inTxt.value;
    inTxt.value = outTxt.value;
    outTxt.value = tempText;

    inChar.innerHTML = inTxt.value.length;

    translate();
  });

  inTxt.addEventListener("input", debounce(() => {
    const val = inTxt.value;
    if (val.length > 5000) {
      inTxt.value = val.slice(0, 5000);
    }
    inChar.innerHTML = inTxt.value.length;

    if (inTxt.value.trim().length > 0) {
      translate();
    } else {
      outTxt.value = "";
    }
  }, 500));

  uploadInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    uploadTitle.innerHTML = file.name;

    if (file.type === "text/plain") {
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = (e) => {
        const content = e.target.result;
        inTxt.value = content.slice(0, 5000);
        inChar.innerHTML = inTxt.value.length;
        translate();
      };
    } else {
      alert("Unsupported file. Use TXT.");
      uploadTitle.innerHTML = "Choose File";
    }
  });

  downloadBtn.addEventListener("click", () => {
    const text = outTxt.value.trim();
    if (!text) {
      alert("Nothing to download.");
      return;
    }

    const lang = outSel.dataset.value;
    const ts = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
    const filename = `translated_${lang}_${ts}.txt`;    
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.download = filename;
    a.href = url;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "Enter") translate();
    if (e.ctrlKey && e.key === "s") {
      e.preventDefault();
      downloadBtn.click();
    }
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "s") {
      e.preventDefault();
      swapBtn.click();
    }
  });

  // Set defaults
  const defaultFrom = inLang.querySelector('[data-value="auto"]');
  if (defaultFrom) {
    inSel.innerHTML = defaultFrom.innerHTML;
    inSel.dataset.value = defaultFrom.dataset.value;
    defaultFrom.classList.add("activeOpt");
  }

  const defaultTo = outLang.querySelector('[data-value="en"]');
  if (defaultTo) {
    outSel.innerHTML = defaultTo.innerHTML;
    outSel.dataset.value = defaultTo.dataset.value;
    defaultTo.classList.add("activeOpt");
  }
});