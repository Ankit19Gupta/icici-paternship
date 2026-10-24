const pincodeData = {
  // adding value accordion fix by Ankit
  122001: { cities: ["SOHNA ADDA", "Gurgaon"], state: "HARYANA" },
  400051: { cities: ["Bandra East", "Mumbai"], state: "Maharashtra" },
  400001: { cities: ["Fort", "Mumbai"], state: "Maharashtra" },
  411001: { cities: ["Pune"], state: "Maharashtra" },
  110001: { cities: ["Connaught Place", "New Delhi"], state: "Delhi" },
  110002: { cities: ["Daryaganj", "New Delhi"], state: "Delhi" },
  500001: { cities: ["Abids", "Hyderabad"], state: "Telangana" },
  500034: { cities: ["Banjara Hills", "Hyderabad"], state: "Telangana" },
  700001: { cities: ["Dalhousie Square", "Kolkata"], state: "West Bengal" },
  700020: { cities: ["Park Street", "Kolkata"], state: "West Bengal" },
  600001: { cities: ["George Town", "Chennai"], state: "Tamil Nadu" },
  560001: { cities: ["MG Road", "Bengaluru"], state: "Karnataka" },
  380001: { cities: ["Bhadra", "Ahmedabad"], state: "Gujarat" },
  302001: { cities: ["MI Road", "Jaipur"], state: "Rajasthan" },
  226001: { cities: ["Hazratganj", "Lucknow"], state: "Uttar Pradesh" },
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const MIN_YEAR = 1940;

// variables to manage partner reduction confirmation
let pendingPartnerReductionCount = null;
let previousPartnerCount = 0;

function pad(n) {
  return n < 10 ? "0" + n : "" + n;
}

function formatYMD(d) {
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}

function sameDay(a, b) {
  return (
    a &&
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function initCalState() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return {
    view: "year",
    viewMonth: today.getMonth(),
    viewYear: today.getFullYear(),
    centerYear: today.getFullYear(),
    selected: null,
  };
}

function buildWeekdays() {
  const w = document.createElement("div");
  w.className = "weekdays";
  ["S", "M", "T", "W", "T", "F", "S"].forEach(function (d) {
    const s = document.createElement("span");
    s.textContent = d;
    w.appendChild(s);
  });
  return w;
}

function buildDaysGrid(state, pop) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const grid = document.createElement("div");
  grid.className = "days";
  const firstDay = new Date(state.viewYear, state.viewMonth, 1).getDay();
  const totalDays = new Date(state.viewYear, state.viewMonth + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    const e = document.createElement("div");
    e.className = "day empty";
    grid.appendChild(e);
  }

  for (let d = 1; d <= totalDays; d++) {
    (function (day) {
      const cellDate = new Date(state.viewYear, state.viewMonth, day);
      cellDate.setHours(0, 0, 0, 0);
      const cell = document.createElement("div");
      cell.className = "day";
      cell.textContent = day;
      if (cellDate > today) cell.classList.add("disabled");
      if (sameDay(cellDate, today)) cell.classList.add("today");
      if (state.selected && sameDay(cellDate, state.selected))
        cell.classList.add("selected");

      if (!cell.classList.contains("disabled")) {
        cell.addEventListener("click", function (e) {
          e.stopPropagation();
          state.selected = cellDate;
          const wrap = pop.closest(".custom-datepicker-wrap");
          const inp = wrap.querySelector(".dobDate, .partner-dob");
          inp.value = formatYMD(cellDate);
          pop.style.display = "none";
          $(pop)
            .closest(".partner-accordion, .partner-accordion-content")
            .removeClass("calendar-open");
          resetAccordionCalendarSpace(pop);
          $(inp).trigger("input").trigger("change");

          const $accordion = $(wrap).closest(".partner-accordion");
          if ($accordion.length) {
            updateValidationState($accordion);
          }
        });
      }
      grid.appendChild(cell);
    })(d);
  }
  return grid;
}

function buildMonthsGrid(state, pop) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const grid = document.createElement("div");
  grid.className = "months";
  MONTHS.forEach(function (m, idx) {
    const item = document.createElement("div");
    item.className = "month-item";
    item.textContent = m;

    const isFuture =
      (state.viewYear === today.getFullYear() && idx > today.getMonth()) ||
      state.viewYear > today.getFullYear();

    if (isFuture) item.classList.add("disabled");
    if (idx === state.viewMonth && state.selected)
      item.classList.add("selected");
    if (idx === today.getMonth() && state.viewYear === today.getFullYear())
      item.classList.add("current");

    if (!isFuture) {
      item.addEventListener("click", function (e) {
        e.stopPropagation();
        state.viewMonth = idx;
        state.view = "day";
        renderCalendar(state, pop);
      });
    }
    grid.appendChild(item);
  });
  return grid;
}

function buildYearsGrid(state, pop) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const grid = document.createElement("div");
  grid.className = "years";
  const start = MIN_YEAR;
  const end = today.getFullYear();

  for (let y = start; y <= end; y++) {
    (function (yr) {
      const item = document.createElement("div");
      item.className = "year-item";
      item.textContent = yr;

      if (yr > today.getFullYear()) item.classList.add("faded");
      if (yr === state.viewYear && state.selected)
        item.classList.add("selected");
      if (yr === today.getFullYear()) item.classList.add("current");
      if (yr <= today.getFullYear()) {
        item.addEventListener("click", function (e) {
          e.stopPropagation();
          state.viewYear = yr;
          state.centerYear = yr;
          state.view = "month";
          renderCalendar(state, pop);
        });
      }
      grid.appendChild(item);
    })(y);
  }
  return grid;
}

function renderCalendar(state, pop) {
  pop.innerHTML = "";
  const nav = document.createElement("div");
  nav.className = "nav-dropdown";
  const yBtn = document.createElement("div");
  yBtn.className = "dd" + (state.view === "year" ? " active" : "");
  yBtn.innerHTML =
    "<span>" +
    state.viewYear +
    "</span><span class='caret'>" +
    (state.view === "year" ? "&#9650;" : "&#9660;") +
    "</span>";
  yBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    state.centerYear = state.viewYear;
    state.view = state.view === "year" ? "day" : "year";
    renderCalendar(state, pop);
  });

  const mBtn = document.createElement("div");
  mBtn.className = "dd" + (state.view === "month" ? " active" : "");
  mBtn.innerHTML =
    "<span>" +
    MONTHS[state.viewMonth] +
    "</span><span class='caret'>" +
    (state.view === "month" ? "&#9650;" : "&#9660;") +
    "</span>";
  mBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    state.view = state.view === "month" ? "day" : "month";
    renderCalendar(state, pop);
  });

  nav.appendChild(yBtn);
  nav.appendChild(mBtn);
  pop.appendChild(nav);

  if (state.view === "day") {
    pop.appendChild(buildWeekdays());
    pop.appendChild(buildDaysGrid(state, pop));
  } else if (state.view === "month") {
    pop.appendChild(buildMonthsGrid(state, pop));
  } else {
    pop.appendChild(buildYearsGrid(state, pop));
    const scrollTarget =
      pop.querySelector(".year-item.selected") ||
      pop.querySelector(".year-item.current");
    if (scrollTarget) {
      setTimeout(() => scrollTarget.scrollIntoView({ block: "center" }), 10);
    }
  }

  if (pop.style.display !== "none") {
    setTimeout(() => adjustAccordionCalendarSpace(pop), 20);
  }
}

function adjustAccordionCalendarSpace(pop) {
  if (!pop || pop.style.display === "none") return;
  const content = pop.closest(".partner-accordion-content");
  if (!content) return;
  content.style.paddingBottom = "";
  const popRect = pop.getBoundingClientRect();
  const contentRect = content.getBoundingClientRect();
  const overflow = popRect.bottom - contentRect.bottom;
  if (overflow > 0) {
    content.style.paddingBottom = Math.ceil(overflow + 14) + "px";
  } else {
    content.style.paddingBottom = "";
  }
}

function resetAccordionCalendarSpace(pop) {
  if (pop) {
    const content = pop.closest(".partner-accordion-content");
    if (content) content.style.paddingBottom = "";
  } else {
    document
      .querySelectorAll(".partner-accordion-content")
      .forEach(function (c) {
        c.style.paddingBottom = "";
      });
  }
}

function openCustomPicker(wrap) {
  const pop = wrap.querySelector(".custom-calendar-popup");
  if (!pop) return;
  if (!pop._calState) pop._calState = initCalState();
  const state = pop._calState;
  const inp = wrap.querySelector(".dobDate, .partner-dob");
  if (inp && inp.value) {
    const parts = inp.value.split("-");
    if (parts.length === 3) {
      const d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
      d.setHours(0, 0, 0, 0);
      state.selected = d;
      state.viewYear = d.getFullYear();
      state.viewMonth = d.getMonth();
      state.centerYear = d.getFullYear();
    }
  }
  state.view = "year";
  renderCalendar(state, pop);
  pop.style.display = "flex";
  $(pop)
    .closest(".partner-accordion, .partner-accordion-content")
    .addClass("calendar-open");
  setTimeout(() => adjustAccordionCalendarSpace(pop), 20);
  setTimeout(function () {
    const scrollContainer = $("#partnershipStep3Modal .stepScroll")[0];
    if (scrollContainer && pop) {
      const popRect = pop.getBoundingClientRect();
      const containerRect = scrollContainer.getBoundingClientRect();
      if (popRect.bottom > containerRect.bottom - 20) {
        scrollContainer.scrollBy({
          top: popRect.bottom - containerRect.bottom + 40,
          behavior: "smooth",
        });
      }
    }
  }, 50);
}

// Custom Calender
function setupPartnershipCalendarHandlers() {
  const $modal = $("#partnershipStep3Modal");
  if (!$modal.length) return;

  $modal.off("click.partnershipCalendar");
  $modal.off("click.partnershipCalendarOutside");
  $modal.on(
    "click.partnershipCalendar",
    ".custom-calendar-popup",
    function (e) {
      e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    },
  );

  $modal.on(
    "click.partnershipCalendar",
    ".custom-datepicker-wrap input, .custom-datepicker-wrap .custom-cal-icon",
    function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      $modal.find(".custom-select-options").hide();
      $modal.find(".custom-select-trigger").removeClass("active");
      $modal.find(".custom-select-wrapper").removeClass("active");

      const wrap = $(this).closest(".custom-datepicker-wrap")[0];
      if (!wrap) return;
      const pop = wrap.querySelector(".custom-calendar-popup");
      if (!pop) return;

      $modal.find(".custom-calendar-popup").each(function () {
        if (this !== pop) {
          this.style.display = "none";
          $(this)
            .closest(".partner-accordion, .partner-accordion-content")
            .removeClass("calendar-open");
          resetAccordionCalendarSpace(this);
        }
      });

      const isClosed = pop.style.display === "none" || pop.style.display === "";
      if (isClosed) {
        openCustomPicker(wrap);
      } else {
        pop.style.display = "none";
        $(pop)
          .closest(".partner-accordion, .partner-accordion-content")
          .removeClass("calendar-open");
        resetAccordionCalendarSpace(pop);
      }
    },
  );

  $modal.on("click.partnershipCalendarOutside", function (e) {
    if ($(e.target).closest(".custom-datepicker-wrap").length === 0) {
      $modal.find(".custom-calendar-popup").each(function () {
        this.style.display = "none";
        $(this)
          .closest(".partner-accordion, .partner-accordion-content")
          .removeClass("calendar-open");
      });
      resetAccordionCalendarSpace();
    }
  });
}

setupPartnershipCalendarHandlers();
$(document).off(
  "click.partnershipCalendarFallback",
  "#partnershipStep3Modal .custom-datepicker-wrap input, #partnershipStep3Modal .custom-datepicker-wrap .custom-cal-icon",
);
$(document).on(
  "click.partnershipCalendarFallback",
  "#partnershipStep3Modal .custom-datepicker-wrap input, #partnershipStep3Modal .custom-datepicker-wrap .custom-cal-icon",
  function (e) {
    if (e.isPropagationStopped && e.isPropagationStopped()) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();

    $("#partnershipStep3Modal .custom-select-options").hide();
    $("#partnershipStep3Modal .custom-select-trigger").removeClass("active");
    $("#partnershipStep3Modal .custom-select-wrapper").removeClass("active");

    const wrap = $(this).closest(".custom-datepicker-wrap")[0];
    if (!wrap) return;
    const pop = wrap.querySelector(".custom-calendar-popup");
    if (!pop) return;

    $("#partnershipStep3Modal .custom-calendar-popup").each(function () {
      if (this !== pop) {
        this.style.display = "none";
        $(this)
          .closest(".partner-accordion, .partner-accordion-content")
          .removeClass("calendar-open");
        resetAccordionCalendarSpace(this);
      }
    });

    const isClosed = pop.style.display === "none" || pop.style.display === "";
    if (isClosed) {
      openCustomPicker(wrap);
    } else {
      pop.style.display = "none";
      $(pop)
        .closest(".partner-accordion, .partner-accordion-content")
        .removeClass("calendar-open");
      resetAccordionCalendarSpace(pop);
    }
  },
);

$(document).off("click.partnershipCalendarDocOutside");
$(document).on("click.partnershipCalendarDocOutside", function (e) {
  if ($(e.target).closest(".custom-datepicker-wrap").length === 0) {
    $("#partnershipStep3Modal .custom-calendar-popup").each(function () {
      this.style.display = "none";
      $(this)
        .closest(".partner-accordion, .partner-accordion-content")
        .removeClass("calendar-open");
    });
    resetAccordionCalendarSpace();
  }
});

// Remove previous conflict handlers
$(document).off("click", "#partnershipStep3Modal .custom-select-trigger");
$(document).off(
  "click",
  "#partnershipStep3Modal .custom-select-options .option-item",
);
$(document).off(
  "click",
  "#partnershipStep3Modal .custom-datepicker-wrap, #partnershipStep3Modal .custom-datepicker-wrap input, #partnershipStep3Modal .custom-datepicker-wrap .custom-cal-icon",
);
$(document).off(
  "click",
  "#partnershipStep3Modal .partner-dob, #partnershipStep3Modal .dobDate",
);
$(document).off("click.partnershipDropdown");
$(document).off("click.partnershipDropdownFallback");
$(document).off("click.partnershipCalendar");
$(document).off("click.partnershipCalendarFallback");
$(document).off("click", ".partner-accordion-header");
$(document).off("click", ".partner-save-btn");
$(document).off("click", ".partner-edit-btn");
$(document).off("click", ".partner-reset-btn");
$(document).off("input change", "#partnerCount");
$(document).off("focus", "#partnerCount");
$(document).off("blur", "#partnerCount"); // fix by ankit Confirmation
$(document).off("click", "#partnershipStep3NextBtn, #step3NextBtn");
$(document).off("click", "#cancelPartnershipStep3Btn, #cancelStep3Btn");
$(document).off("click", "#modalPartnershipStep3CloseBtn");
$(document).off("click", "#partnershipSaveExitBtn");
$(document).off("click", "#confirmPartnerBtn"); // fix by ankit Confirmation
$(document).off("click", "#cancelPartnerBtn"); // fix by ankit Confirmation

function openPartnershipStep3Modal() {
  $("#partnershipStep3Modal").show();
  setupPartnershipDropdownHandlers();
  setupPartnershipCalendarHandlers();
  checkAllPartnersSaved();
}

function closePartnershipStep3Modal() {
  $("#partnershipStep3Modal").hide();
  $("#partnerConfirmationModal").removeClass("show").hide();
  pendingPartnerReductionCount = null;
}

// Copy application number to clipboard
$(document).on(
  "click",
  "#partnershipStep3Modal .copy-contact, #partnershipStep3Modal .copy-icon",
  function () {
    const appNo = $("#partnershipApplicationNumber").text().trim();
    if (!appNo) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(appNo);
    } else {
      const temp = $("<input>");
      $("body").append(temp);
      temp.val(appNo).select();
      document.execCommand("copy");
      temp.remove();
    }

    const $icon = $(this).is(".copy-icon")
      ? $(this)
      : $(this).find(".copy-icon");
    const originalText = $icon.text();
    $icon.text("done");
    setTimeout(function () {
      $icon.text(originalText);
    }, 1500);
  },
);

// Close & Back Handlers
$(document).on("click", "#modalPartnershipStep3CloseBtn", function (e) {
  e.preventDefault();
  closePartnershipStep3Modal();
});

//  Back handlers
$(document).on("click", "#cancelPartnershipStep3Btn", function (e) {
  e.preventDefault();
  closePartnershipStep3Modal();
  if ($("#step2Modal").length) {
    $("#step2Modal").show();
  }
});

// Save & Exit Handler
$(document).on("click", "#partnershipSaveExitBtn", function (e) {
  e.preventDefault();
  if ($(this).hasClass("disabled-link") || $(this).prop("disabled")) return;
  closePartnershipStep3Modal();
  if ($("#saveProgressModal").length) {
    $("#saveProgressModal").show();
  }
});

// Proceed - Next Button
$(document).on("click", "#partnershipStep3NextBtn", function (e) {
  e.preventDefault();
  if ($(this).prop("disabled")) return;
  if (validatePartnershipStep3()) {
    closePartnershipStep3Modal();
    if ($("#step4Modal").length) {
      $("#step4Modal").show();
    }
  }
});

// Adding default value accordion fix by Ankit
const dummyPartnerData = [
  {
    ADDRESS: "andheri east 11",
    AGE_RESTICTION: "true",
    CATEGORY: "General",
    CITY: "SOHNA ADDA",
    COMMUNITY: "Hindu",
    DOB: "1979-08-02",
    EMAIL_ID: "a@g.csss",
    FIRST_NAME: "AAAAAA",
    GENDER: "Female",
    LAST_NAME: "CCCCCCCCC",
    MIDDLE_NAME: null,
    MOBILE_NUMBER: "9999546499",
    PARTNER_PAN: "ABCPD0002P",
    PERCOFCONTROL: 100,
    PIN_CODE: "122001",
    PREFIX: "Mr.",
    STATE: "HARYANA",
  },
  {
    ADDRESS: "andheri east 12",
    AGE_RESTICTION: "true",
    CATEGORY: "General",
    CITY: "SOHNA ADDA",
    COMMUNITY: "Hindu",
    DOB: "1982-05-15",
    EMAIL_ID: "b@g.csss",
    FIRST_NAME: "FFFFF",
    GENDER: "Male",
    LAST_NAME: "GGGGG",
    MIDDLE_NAME: null,
    MOBILE_NUMBER: "9999546498",
    PARTNER_PAN: "ABCPD0002M",
    PERCOFCONTROL: 0,
    PIN_CODE: "122001",
    PREFIX: "Mr.",
    STATE: "HARYANA",
  },
  {
    ADDRESS: "andheri east 13",
    AGE_RESTICTION: "true",
    CATEGORY: "General",
    CITY: "SOHNA ADDA",
    COMMUNITY: "Hindu",
    DOB: "1985-11-20",
    EMAIL_ID: "c@g.csss",
    FIRST_NAME: "SSSSS",
    GENDER: "Male",
    LAST_NAME: "JJJJJ",
    MIDDLE_NAME: null,
    MOBILE_NUMBER: "9999546497",
    PARTNER_PAN: "ABCPD0002L",
    PERCOFCONTROL: 0,
    PIN_CODE: "122001",
    PREFIX: "Mr.",
    STATE: "HARYANA",
  },
];

// Adding default value accordion fix by Ankit
async function partnershipStep3DataMappingOnLoad($partnershipStep3Modal) {
  let allPartners;
  try {
    allPartners = await callApi(
      "/supply-chain-finance/sanction/get-all-partners-data",
      "GET",
      null,
      "step3 fetch partners data",
      true,
    );
  } catch (e) {
    allPartners = dummyPartnerData;
  }

  if (!allPartners || !allPartners.length) {
    allPartners =
      typeof _entryPointSubmitData !== "undefined" &&
      _entryPointSubmitData.allPartners
        ? _entryPointSubmitData.allPartners
        : dummyPartnerData;
  }

  if (typeof _entryPointSubmitData !== "undefined") {
    _entryPointSubmitData.allPartners = allPartners;
    let extData = _entryPointSubmitData.ext_data;
    if (extData && extData.PINSTID) {
      $("#partnershipStep3Modal #partnershipApplicationNumber").text(
        extData.PINSTID,
      );
    }
  }

  let partnerCount = allPartners.length;
  $("#partnerCount").val(partnerCount !== 0 ? partnerCount : "");
  const $container = $("#partnerAccordionContainer");
  $container.empty();

  for (var i = 1; i <= partnerCount; i++) {
    const partnerData = allPartners[i - 1];
    $container.append(getPartnerFormHtml(i, partnerData));
  }

  previousPartnerCount = i - 1;
  syncUniquenessAcrossAccordions();
  checkAllPartnersSaved();
}

// Adding default value accordion fix by Ankit
// Dynamic Partner Html Page
function getPartnerFormHtml(num, data) {
  data = data || {};
  const prefix = data.PREFIX || "Mr.";
  const firstName = data.FIRST_NAME || "";
  const middleName =
    data.MIDDLE_NAME && data.MIDDLE_NAME !== "null" ? data.MIDDLE_NAME : "";
  const lastName = data.LAST_NAME || "";
  const mobile = data.MOBILE_NUMBER || "";
  const email = data.EMAIL_ID || "";
  const pan = (data.PARTNER_PAN || "").toUpperCase();
  const ownership =
    data.PERCOFCONTROL !== undefined && data.PERCOFCONTROL !== null
      ? data.PERCOFCONTROL
      : "";
  const gender = data.GENDER || "";
  const dob = data.DOB || "";
  const address = data.ADDRESS || "";
  const pincode = data.PIN_CODE || "";
  const city = data.CITY || "";
  const state = data.STATE || "";
  const community = data.COMMUNITY || "";
  const category = data.CATEGORY || "";

  const hasCityState = Boolean(city || state || pincode);
  const cityDisplay = hasCityState ? "block" : "none";

  return (
    '<div class="partner-accordion" data-partner="' +
    num +
    '">' +
    '<div class="partner-accordion-header">' +
    '<span class="partner-accordion-span">Partner ' +
    num +
    "</span>" +
    '<i class="material-icons">expand_more</i>' +
    "</div>" +
    '<div class="partner-accordion-content" style="display: none">' +
    '<div class="proprietor-grid custom-margin">' +
    '<div class="proprietor-first-section">' +
    '<div class="proprietor-gender">' +
    "<label>Title</label>" +
    '<div class="custom-select-wrapper title-select" id="partnerTitleWrapper_' +
    num +
    '" columns_name="title">' +
    '<div class="custom-select-trigger">' +
    '<span class="selected-option" id="partnerTitleSpan_' +
    num +
    '">' +
    prefix +
    "</span>" +
    '<div class="select-right"><i class="material-icons">expand_more</i></div>' +
    "</div>" +
    '<div class="custom-select-options" style="display: none">' +
    '<div class="option-item' +
    (prefix === "Mr." ? " selected" : "") +
    '" data-value="Mr.">Mr.</div>' +
    '<div class="option-item' +
    (prefix === "Miss." ? " selected" : "") +
    '" data-value="Miss.">Miss.</div>' +
    '<div class="option-item' +
    (prefix === "Ms." ? " selected" : "") +
    '" data-value="Ms.">Ms.</div>' +
    '<div class="option-item' +
    (prefix === "Dr." ? " selected" : "") +
    '" data-value="Dr.">Dr.</div>' +
    "</div>" +
    "</div>" +
    '<select id="partnerTitle_' +
    num +
    '" class="partner-title" style="display: none" columns_name="title">' +
    '<option value="Mr."' +
    (prefix === "Mr." ? " selected" : "") +
    ">Mr.</option>" +
    '<option value="Miss."' +
    (prefix === "Miss." ? " selected" : "") +
    ">Miss.</option>" +
    '<option value="Ms."' +
    (prefix === "Ms." ? " selected" : "") +
    ">Ms.</option>" +
    '<option value="Dr."' +
    (prefix === "Dr." ? " selected" : "") +
    ">Dr.</option>" +
    "</select>" +
    "</div>" +
    '<div class="field-wrapper">' +
    '<label>First name as per PAN <span class="partner-required">*</span></label>' +
    '<input type="text" id="partnerFirstName_' +
    num +
    '" class="partner-first-name" placeholder="Enter first name" value="' +
    firstName +
    '" columns_name="first_name" />' +
    '<div class="error-step3-handle" style="display: none"><i class="material-icons">info</i><p>First name must be at least 3 characters.</p></div>' +
    "</div>" +
    "</div>" +
    "<div>" +
    '<div class="properties-middle">' +
    '<div class="custom-properties-middle field-wrapper">' +
    '<label>Middle name <span class="incorporation-yy">(optional)</span></label>' +
    '<input type="text" id="partnerMiddleName_' +
    num +
    '" class="partner-middle-name" placeholder="Enter middle name" value="' +
    middleName +
    '" columns_name="middle_name" />' +
    '<div class="error-step3-handle" style="display: none"><i class="material-icons">info</i><p>Middle name must be at least 3 characters.</p></div>' +
    "</div>" +
    '<div class="custom-properties-middle field-wrapper error-state-pan">' +
    '<label>Last name as per PAN <span class="partner-required">*</span></label>' +
    '<input type="text" id="partnerLastName_' +
    num +
    '" class="partner-last-name" placeholder="Enter last name" value="' +
    lastName +
    '" columns_name="last_name" />' +
    '<div class="error-step3-handle" style="display: none"><i class="material-icons">info</i><p>Last name must be at least 3 characters.</p></div>' +
    "</div>" +
    "</div>" +
    "</div>" +
    '<div class="field-wrapper">' +
    '<label>Mobile number <span class="partner-required">*</span></label>' +
    '<div class="properties-mobile-number-section">' +
    '<input type="text" id="partnerMobile_' +
    num +
    '" class="partner-mobile" placeholder="10 digit mobile number" maxlength="14" value="' +
    mobile +
    '" columns_name="mobile_number" />' +
    "</div>" +
    '<div class="error-step3-handle" style="display: none"><i class="material-icons">info</i><p>Entered mobile number is in wrong format, please enter a valid 10-digit number.</p></div>' +
    "</div>" +
    '<div class="field-wrapper">' +
    '<label>Email ID <span class="partner-required">*</span></label>' +
    '<input type="email" id="partnerEmail_' +
    num +
    '" class="partner-email" placeholder="Enter ID" value="' +
    email +
    '" columns_name="email_id" />' +
    '<div class="error-step3-handle" style="display: none"><i class="material-icons">info</i><p>Entered email ID is in wrong format, please enter a valid email id.</p></div>' +
    "</div>" +
    '<div class="field-wrapper">' +
    '<label>PAN number <span class="partner-required">*</span></label>' +
    '<input type="text" id="partnerPan_' +
    num +
    '" class="partner-pan" placeholder="Enter PAN" maxlength="10" style="text-transform: uppercase" value="' +
    pan +
    '" columns_name="pan_number" />' +
    '<div class="error-step3-handle" style="display: none"><i class="material-icons">info</i><p>Please enter a valid PAN number.</p></div>' +
    "</div>" +
    '<div class="field-wrapper">' +
    '<label>Ownership control (%) <span class="partner-required">*</span></label>' +
    '<div class="position">' +
    '<input type="number" id="partnerOwnership_' +
    num +
    '" class="partner-ownership ownership-input" placeholder="0" min="1" max="100" value="' +
    ownership +
    '" columns_name="ownership_percentage" />' +
    '<span class="percentage-owner">%</span>' +
    "</div>" +
    '<div class="error-step3-handle" style="display: none"><i class="material-icons">info</i><p>Percentage must be between 1 and 100.</p></div>' +
    "</div>" +
    "<div>" +
    '<div class="proprietor-gender-section field-wrapper">' +
    '<label>Gender <span class="partner-required">*</span></label>' +
    '<div class="custom-select-wrapper gender-select" id="partnerGenderWrapper_' +
    num +
    '" columns_name="gender">' +
    '<div class="custom-select-trigger">' +
    '<span class="selected-option' +
    (gender ? "" : " placeholder") +
    '" id="partnerGenderSpan_' +
    num +
    '">' +
    (gender || "Select gender") +
    "</span>" +
    '<div class="select-right"><i class="material-icons">expand_more</i></div>' +
    "</div>" +
    '<div class="custom-select-options" style="display: none">' +
    '<div class="option-item' +
    (gender === "Male" ? " selected" : "") +
    '" data-value="Male">Male</div>' +
    '<div class="option-item' +
    (gender === "Female" ? " selected" : "") +
    '" data-value="Female">Female</div>' +
    '<div class="option-item' +
    (gender === "Others" ? " selected" : "") +
    '" data-value="Others">Others</div>' +
    "</div>" +
    "</div>" +
    '<select id="partnerGender_' +
    num +
    '" class="partner-gender" style="display: none" columns_name="gender">' +
    '<option value="">Select gender</option>' +
    '<option value="Male"' +
    (gender === "Male" ? " selected" : "") +
    ">Male</option>" +
    '<option value="Female"' +
    (gender === "Female" ? " selected" : "") +
    ">Female</option>" +
    '<option value="Others"' +
    (gender === "Others" ? " selected" : "") +
    ">Others</option>" +
    "</select>" +
    "</div>" +
    "</div>" +
    "<div>" +
    '<div class="width field-wrapper">' +
    '<label>Date of birth as per aadhaar <span class="incorporation-yy">(yyyy-mm-dd)</span> <span class="partner-required">*</span></label>' +
    '<div class="date-input custom-datepicker-wrap">' +
    '<input type="text" id="partnerDob_' +
    num +
    '" class="partner-dob dobDate" placeholder="Select date (yyyy-mm-dd)" readonly value="' +
    dob +
    '" columns_name="date_of_birth" />' +
    '<span class="material-icons custom-cal-icon">calendar_today</span>' +
    '<div class="custom-calendar-popup" id="partnerDobPopup_' +
    num +
    '" style="display: none"></div>' +
    "</div>" +
    "</div>" +
    "</div>" +
    "</div>" +
    '<div class="proprietor-grid">' +
    "<div>" +
    '<div class="field-wrapper">' +
    '<label>Address <span class="partner-required">*</span></label>' +
    '<input type="text" id="partnerAddress_' +
    num +
    '" class="partner-address" placeholder="Enter address" value="' +
    address +
    '" columns_name="address" />' +
    '<div class="error-step3-handle" style="display: none"><i class="material-icons">info</i><p>Please enter a valid Address.</p></div>' +
    "</div>" +
    '<div class="field-wrapper city-field cityAddressBlock" style="display: ' +
    cityDisplay +
    '">' +
    '<label>City <span class="urc-p">*</span></label>' +
    '<div class="custom-select-wrapper cityCustomSelect" id="partnerCityWrapper_' +
    num +
    '" columns_name="city">' +
    '<div class="custom-select-trigger">' +
    '<span class="selected-option' +
    (city ? "" : " placeholder") +
    '" id="partnerCitySpan_' +
    num +
    '">' +
    (city || "Select city") +
    "</span>" +
    '<div class="select-right"><i class="material-icons">expand_more</i></div>' +
    "</div>" +
    '<div class="custom-select-options" style="display: none">' +
    (city
      ? '<div class="option-item selected" data-value="' +
        city +
        '">' +
        city +
        "</div>"
      : "") +
    "</div>" +
    "</div>" +
    '<select id="partnerCity_' +
    num +
    '" class="city-select" style="display: none" columns_name="city"><option value="' +
    (city || "") +
    '" selected>' +
    (city || "Select city") +
    "</option></select>" +
    "</div>" +
    "</div>" +
    "<div>" +
    '<div class="field-wrapper">' +
    '<label>Pin code <span class="partner-required">*</span></label>' +
    '<input type="text" inputmode="numeric" id="partnerPincode_' +
    num +
    '" class="partner-pincode pincode-input" placeholder="Enter pin code" maxlength="6" value="' +
    pincode +
    '" columns_name="pin_code" />' +
    '<div class="error-step3-handle" style="display: none"><i class="material-icons">info</i><p>Entered pin code is in wrong format, please enter a valid 6 digit pin.</p></div>' +
    "</div>" +
    '<div class="field-wrapper city-field cityAddressBlock" style="display: ' +
    cityDisplay +
    '">' +
    '<label>State <span class="urc-p">*</span></label>' +
    '<div class="state-display-wrapper">' +
    '<input type="text" id="partnerState_' +
    num +
    '" class="partner-state state-input" placeholder="State" readonly value="' +
    state +
    '" columns_name="state" />' +
    "</div>" +
    "</div>" +
    "</div>" +
    "<div>" +
    '<div class="proprietor-gender-section field-wrapper">' +
    '<label>Community <span class="partner-required">*</span></label>' +
    '<div class="custom-select-wrapper community-select" id="partnerCommunityWrapper_' +
    num +
    '" columns_name="community">' +
    '<div class="custom-select-trigger">' +
    '<span class="selected-option' +
    (community ? "" : " placeholder") +
    '" id="partnerCommunitySpan_' +
    num +
    '">' +
    (community || "Select community") +
    "</span>" +
    '<div class="select-right"><i class="material-icons">expand_more</i></div>' +
    "</div>" +
    '<div class="custom-select-options" style="display: none">' +
    '<div class="option-item' +
    (community === "Hindu" ? " selected" : "") +
    '" data-value="Hindu">Hindu</div>' +
    '<div class="option-item' +
    (community === "Muslim" ? " selected" : "") +
    '" data-value="Muslim">Muslim</div>' +
    '<div class="option-item' +
    (community === "Sikh" ? " selected" : "") +
    '" data-value="Sikh">Sikh</div>' +
    '<div class="option-item' +
    (community === "Christian" ? " selected" : "") +
    '" data-value="Christian">Christian</div>' +
    '<div class="option-item' +
    (community === "Jain" ? " selected" : "") +
    '" data-value="Jain">Jain</div>' +
    '<div class="option-item' +
    (community === "Buddhist" ? " selected" : "") +
    '" data-value="Buddhist">Buddhist</div>' +
    '<div class="option-item' +
    (community === "Parsi" ? " selected" : "") +
    '" data-value="Parsi">Parsi</div>' +
    '<div class="option-item' +
    (community === "Others" ? " selected" : "") +
    '" data-value="Others">Others</div>' +
    "</div>" +
    "</div>" +
    '<select id="partnerCommunity_' +
    num +
    '" class="partner-community" style="display: none" columns_name="community">' +
    '<option value="">Select community</option>' +
    '<option value="Hindu"' +
    (community === "Hindu" ? " selected" : "") +
    ">Hindu</option>" +
    '<option value="Muslim"' +
    (community === "Muslim" ? " selected" : "") +
    ">Muslim</option>" +
    '<option value="Sikh"' +
    (community === "Sikh" ? " selected" : "") +
    ">Sikh</option>" +
    '<option value="Christian"' +
    (community === "Christian" ? " selected" : "") +
    ">Christian</option>" +
    '<option value="Jain"' +
    (community === "Jain" ? " selected" : "") +
    ">Jain</option>" +
    '<option value="Buddhist"' +
    (community === "Buddhist" ? " selected" : "") +
    ">Buddhist</option>" +
    '<option value="Parsi"' +
    (community === "Parsi" ? " selected" : "") +
    ">Parsi</option>" +
    '<option value="Others"' +
    (community === "Others" ? " selected" : "") +
    ">Others</option>" +
    "</select>" +
    "</div>" +
    "</div>" +
    "<div>" +
    '<div class="proprietor-gender-section field-wrapper">' +
    '<label>Category <span class="partner-required">*</span></label>' +
    '<div class="custom-select-wrapper category-select" id="partnerCategoryWrapper_' +
    num +
    '" columns_name="category">' +
    '<div class="custom-select-trigger">' +
    '<span class="selected-option' +
    (category ? "" : " placeholder") +
    '" id="partnerCategorySpan_' +
    num +
    '">' +
    (category || "Select category") +
    "</span>" +
    '<div class="select-right"><i class="material-icons">expand_more</i></div>' +
    "</div>" +
    '<div class="custom-select-options" style="display: none">' +
    '<div class="option-item' +
    (category === "General" ? " selected" : "") +
    '" data-value="General">General</div>' +
    '<div class="option-item' +
    (category === "OBC" ? " selected" : "") +
    '" data-value="OBC">OBC</div>' +
    '<div class="option-item' +
    (category === "SC" ? " selected" : "") +
    '" data-value="SC">SC</div>' +
    '<div class="option-item' +
    (category === "ST" ? " selected" : "") +
    '" data-value="ST">ST</div>' +
    '<div class="option-item' +
    (category === "EWS" ? " selected" : "") +
    '" data-value="EWS">EWS</div>' +
    "</div>" +
    "</div>" +
    '<select id="partnerCategory_' +
    num +
    '" class="partner-category" style="display: none" columns_name="category">' +
    '<option value="">Select category</option>' +
    '<option value="General"' +
    (category === "General" ? " selected" : "") +
    ">General</option>" +
    '<option value="OBC"' +
    (category === "OBC" ? " selected" : "") +
    ">OBC</option>" +
    '<option value="SC"' +
    (category === "SC" ? " selected" : "") +
    ">SC</option>" +
    '<option value="ST"' +
    (category === "ST" ? " selected" : "") +
    ">ST</option>" +
    '<option value="EWS"' +
    (category === "EWS" ? " selected" : "") +
    ">EWS</option>" +
    "</select>" +
    "</div>" +
    "</div>" +
    "</div>" +
    '<div class="partner-asset-top">' +
    '<button type="button" id="partnerResetBtn_' +
    num +
    '" class="partner-reset-btn">Reset</button>' +
    '<button type="button" id="partnerSaveBtn_' +
    num +
    '" class="partner-save-btn" disabled>Save</button>' +
    "</div>" +
    "</div>" +
    "</div>"
  );
}

// Pincode, City ad State
function populateCityAndState($container, pincode) {
  const cleanPin = (pincode || "").replace(/\D/g, "");
  const num = $container.closest(".partner-accordion").data("partner");
  const cityBlock = $container.find(".cityAddressBlock");
  const citySelect = $("#partnerCityWrapper_" + num).length
    ? $("#partnerCityWrapper_" + num)
    : $container.find(".cityCustomSelect");
  const stateInput = $("#partnerState_" + num).length
    ? $("#partnerState_" + num)
    : $container.find(".partner-state, .state-input");

  if (cleanPin.length === 6 && pincodeData[cleanPin]) {
    const info = pincodeData[cleanPin];
    cityBlock.show();

    if (stateInput.length) {
      stateInput.val(info.state).removeClass("is-error").addClass("is-success");
    }

    if (citySelect.length) {
      const optionsContainer = citySelect.find(".custom-select-options");
      const triggerSpan = citySelect.find(
        ".custom-select-trigger .selected-option",
      );
      const hiddenSelect = $("#partnerCity_" + num).length
        ? $("#partnerCity_" + num)
        : citySelect.siblings("select.city-select");

      optionsContainer.empty();
      info.cities.forEach(function (city) {
        optionsContainer.append(
          '<div class="option-item" data-value="' +
            city +
            '">' +
            city +
            "</div>",
        );
      });

      const selectedCity = info.cities[0] || "";
      triggerSpan.text(selectedCity).removeClass("placeholder");
      if (hiddenSelect.length) {
        hiddenSelect.empty();
        info.cities.forEach(function (city) {
          hiddenSelect.append(
            '<option value="' + city + '">' + city + "</option>",
          );
        });
        hiddenSelect.val(selectedCity);
      }
      optionsContainer
        .find('.option-item[data-value="' + selectedCity + '"]')
        .addClass("selected");
    }
  } else if (cleanPin.length === 6) {
    cityBlock.show();
    if (stateInput.length) stateInput.val("Not found").addClass("is-error");
    if (citySelect.length) {
      citySelect.find(".selected-option").text("Select city");
      citySelect.siblings("select").val("");
      citySelect.find(".custom-select-options").empty();
    }
  } else {
    cityBlock.hide();
    if (stateInput.length)
      stateInput.val("").removeClass("is-error is-success");
    if (citySelect.length) {
      citySelect.find(".selected-option").text("Select city");
      citySelect.siblings("select").val("");
      citySelect.find(".custom-select-options").empty();
    }
  }

  const $accordion = $container.closest(".partner-accordion");
  if ($accordion.length) {
    updateValidationState($accordion);
  }
}

function setupPartnershipDropdownHandlers() {
  const $modal = $("#partnershipStep3Modal");
  if (!$modal.length) return;

  $modal.off("click.partnershipDropdown", ".custom-select-trigger");
  $modal.off(
    "click.partnershipDropdown",
    ".custom-select-options .option-item",
  );
  $modal.off("click.partnershipDropdownClose");

  $modal.on(
    "click.partnershipDropdown",
    ".custom-select-trigger",
    function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();

      // Close any open custom calendars in the modal
      $modal.find(".custom-calendar-popup").hide();
      $modal
        .find(".partner-accordion, .partner-accordion-content")
        .removeClass("calendar-open");

      const wrapper = $(this).closest(".custom-select-wrapper");
      const options = wrapper.find(".custom-select-options");
      const isOpen = options.is(":visible") || wrapper.hasClass("active");

      // Close any other open dropdowns inside partnershipStep3Modal
      $modal.find(".custom-select-options").not(options).hide();
      $modal.find(".custom-select-trigger").not(this).removeClass("active");
      $modal.find(".custom-select-wrapper").not(wrapper).removeClass("active");

      if (isOpen) {
        options.hide();
        $(this).removeClass("active");
        wrapper.removeClass("active");
      } else {
        options.show();
        $(this).addClass("active");
        wrapper.addClass("active");
      }
    },
  );

  // dropdown fix by Ankit: Option item click handler scoped directly to #partnershipStep3Modal
  $modal.on(
    "click.partnershipDropdown",
    ".custom-select-options .option-item",
    function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();

      const wrapper = $(this).closest(".custom-select-wrapper");
      const trigger = wrapper.find(".custom-select-trigger");
      const selectedSpan = trigger.find(".selected-option");
      const hiddenSelect = wrapper.siblings("select");
      const options = wrapper.find(".custom-select-options");
      const value = $(this).data("value");
      const text = $(this).text().trim();

      selectedSpan.text(text).removeClass("placeholder");

      if (hiddenSelect.length) {
        hiddenSelect.val(value);
        hiddenSelect.trigger("change");
      }

      options.find(".option-item").removeClass("selected");
      $(this).addClass("selected");
      options.hide();
      trigger.removeClass("active");
      wrapper.removeClass("active");

      const $accordion = wrapper.closest(".partner-accordion");
      if ($accordion.length && !$accordion.hasClass("saved")) {
        updateValidationState($accordion);
      }
    },
  );

  // dropdown fix by Ankit: Close dropdown when clicking outside inside the modal
  $modal.on("click.partnershipDropdownClose", function (e) {
    if (!$(e.target).closest(".custom-select-wrapper").length) {
      $modal.find(".custom-select-options").hide();
      $modal.find(".custom-select-trigger").removeClass("active");
      $modal.find(".custom-select-wrapper").removeClass("active");
    }
  });
}

// Initial call to attach directly to #partnershipStep3Modal
setupPartnershipDropdownHandlers();

// dropdown fix by Ankit: Global fallback on document to ensure clicks are caught even if modal was re-rendered
$(document).off(
  "click.partnershipDropdownFallback",
  "#partnershipStep3Modal .custom-select-trigger",
);
$(document).on(
  "click.partnershipDropdownFallback",
  "#partnershipStep3Modal .custom-select-trigger",
  function (e) {
    if (e.isPropagationStopped && e.isPropagationStopped()) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();

    $("#partnershipStep3Modal .custom-calendar-popup").hide();
    $("#partnershipStep3Modal")
      .find(".partner-accordion, .partner-accordion-content")
      .removeClass("calendar-open");

    const wrapper = $(this).closest(".custom-select-wrapper");
    const options = wrapper.find(".custom-select-options");
    const isOpen = options.is(":visible") || wrapper.hasClass("active");

    $("#partnershipStep3Modal .custom-select-options").not(options).hide();
    $("#partnershipStep3Modal .custom-select-trigger")
      .not(this)
      .removeClass("active");
    $("#partnershipStep3Modal .custom-select-wrapper")
      .not(wrapper)
      .removeClass("active");

    if (isOpen) {
      options.hide();
      $(this).removeClass("active");
      wrapper.removeClass("active");
    } else {
      options.show();
      $(this).addClass("active");
      wrapper.addClass("active");
    }
  },
);

$(document).off(
  "click.partnershipDropdownFallback",
  "#partnershipStep3Modal .custom-select-options .option-item",
);
$(document).on(
  "click.partnershipDropdownFallback",
  "#partnershipStep3Modal .custom-select-options .option-item",
  function (e) {
    if (e.isPropagationStopped && e.isPropagationStopped()) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();

    const wrapper = $(this).closest(".custom-select-wrapper");
    const trigger = wrapper.find(".custom-select-trigger");
    const selectedSpan = trigger.find(".selected-option");
    const hiddenSelect = wrapper.siblings("select");
    const options = wrapper.find(".custom-select-options");
    const value = $(this).data("value");
    const text = $(this).text().trim();

    selectedSpan.text(text).removeClass("placeholder");

    if (hiddenSelect.length) {
      hiddenSelect.val(value);
      hiddenSelect.trigger("change");
    }

    options.find(".option-item").removeClass("selected");
    $(this).addClass("selected");
    options.hide();
    trigger.removeClass("active");
    wrapper.removeClass("active");

    const $accordion = wrapper.closest(".partner-accordion");
    if ($accordion.length && !$accordion.hasClass("saved")) {
      updateValidationState($accordion);
    }
  },
);

// dropdown fix by Ankit: Document level click-outside handler
$(document).off("click.partnershipOutsideClose");
$(document).on("click.partnershipOutsideClose", function (e) {
  if (
    !$(e.target).closest("#partnershipStep3Modal .custom-select-wrapper").length
  ) {
    $("#partnershipStep3Modal .custom-select-options").hide();
    $("#partnershipStep3Modal .custom-select-trigger").removeClass("active");
    $("#partnershipStep3Modal .custom-select-wrapper").removeClass("active");
  }
});

// Uniqueness & Validation Helpers for Partners
function getCleanMobileNumber(val) {
  let digits = (val || "").replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length === 12) {
    digits = digits.slice(2);
  }
  return digits;
}

function getCleanPanNumber(val) {
  return (val || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

function getCleanEmail(val) {
  return (val || "").trim().toLowerCase();
}

function formatPartnerTitle(val) {
  if (!val) return "Mr.";
  let clean = val.trim().replace(/\.+$/, "");
  if (!clean) return "Mr.";
  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase() + ".";
}

function isFieldUniqueAcrossPartners(field, value, currentNum) {
  if (!value) return true;
  let isUnique = true;
  $("#partnershipStep3Modal .partner-accordion").each(function () {
    const otherNum = $(this).data("partner");
    if (otherNum && String(otherNum) !== String(currentNum)) {
      if (field === "pan") {
        const otherPan = getCleanPanNumber($("#partnerPan_" + otherNum).val());
        if (otherPan && otherPan.length === 10 && otherPan === value) {
          isUnique = false;
          return false;
        }
      } else if (field === "mobile") {
        const otherMobile = getCleanMobileNumber(
          $("#partnerMobile_" + otherNum).val(),
        );
        if (otherMobile && otherMobile.length === 10 && otherMobile === value) {
          isUnique = false;
          return false;
        }
      } else if (field === "email") {
        const otherEmail = getCleanEmail($("#partnerEmail_" + otherNum).val());
        if (otherEmail && otherEmail.length > 0 && otherEmail === value) {
          isUnique = false;
          return false;
        }
      }
    }
  });
  return isUnique;
}

function syncUniquenessAcrossAccordions(fieldToSync) {
  const $accordions = $("#partnershipStep3Modal .partner-accordion");

  $accordions.each(function () {
    const num = $(this).data("partner");
    if (!num) return;
    const $acc = $(this);
    const isSaved = $acc.hasClass("saved");

    // Check Mobile
    if (!fieldToSync || fieldToSync === "mobile") {
      const $mobileInput = $("#partnerMobile_" + num);
      if ($mobileInput.length) {
        const $err = $mobileInput
          .closest(".field-wrapper")
          .find(".error-step3-handle");
        const mobileVal = getCleanMobileNumber($mobileInput.val());
        if (mobileVal.length === 10) {
          const isUnique = isFieldUniqueAcrossPartners(
            "mobile",
            mobileVal,
            num,
          );
          if (!isUnique) {
            $err
              .find("p")
              .text("Mobile number is already used for another partner.");
            $err.show();
            $mobileInput.addClass("is-error").removeClass("is-success");
          } else if ($err.find("p").text().indexOf("already used") !== -1) {
            $err.hide();
            $mobileInput.removeClass("is-error").addClass("is-success");
          }
        }
      }
    }

    // Check Email
    if (!fieldToSync || fieldToSync === "email") {
      const $emailInput = $("#partnerEmail_" + num);
      if ($emailInput.length) {
        const $err = $emailInput
          .closest(".field-wrapper")
          .find(".error-step3-handle");
        const emailVal = getCleanEmail($emailInput.val());
        const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);
        if (isValidEmail) {
          const isUnique = isFieldUniqueAcrossPartners("email", emailVal, num);
          if (!isUnique) {
            $err
              .find("p")
              .text("Email ID is already used for another partner.");
            $err.show();
            $emailInput.addClass("is-error").removeClass("is-success");
          } else if ($err.find("p").text().indexOf("already used") !== -1) {
            $err.hide();
            $emailInput.removeClass("is-error").addClass("is-success");
          }
        }
      }
    }

    // Check PAN
    if (!fieldToSync || fieldToSync === "pan") {
      const $panInput = $("#partnerPan_" + num);
      if ($panInput.length) {
        const $err = $panInput
          .closest(".field-wrapper")
          .find(".error-step3-handle");
        const panVal = getCleanPanNumber($panInput.val());
        const isValidPan =
          /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panVal) || panVal.length === 10;
        if (isValidPan && panVal.length === 10) {
          const isUnique = isFieldUniqueAcrossPartners("pan", panVal, num);
          if (!isUnique) {
            $err
              .find("p")
              .text("PAN number is already used for another partner.");
            $err.show();
            $panInput.addClass("is-error").removeClass("is-success");
          } else if ($err.find("p").text().indexOf("already used") !== -1) {
            $err.hide();
            $panInput.removeClass("is-error").addClass("is-success");
          }
        }
      }
    }

    if (!isSaved) {
      updateValidationState($acc);
    }
  });
}

// Input Vaidation
// Contains Names: letters only, min 3 characters
$(document).on(
  "input",
  '#partnershipStep3Modal input.partner-first-name, #partnershipStep3Modal input.partner-middle-name, #partnershipStep3Modal input.partner-last-name, #partnershipStep3Modal input[placeholder*="first name"], #partnershipStep3Modal input[placeholder*="middle name"], #partnershipStep3Modal input[placeholder*="last name"]',
  function () {
    $(this).val(
      $(this)
        .val()
        .replace(/[^a-zA-Z\s]/g, ""),
    );
    const val = $(this).val().trim();
    const $errorDiv = $(this)
      .closest(".field-wrapper")
      .find(".error-step3-handle");
    const isMiddle =
      $(this).hasClass("partner-middle-name") ||
      ($(this).attr("placeholder") &&
        $(this).attr("placeholder").indexOf("middle name") !== -1);

    if (val.length >= 3) {
      $errorDiv.hide();
      $(this).removeClass("is-error");
    } else if (isMiddle && val.length === 0) {
      $errorDiv.hide();
      $(this).removeClass("is-error is-success");
    }

    const $acc = $(this).closest(".partner-accordion");
    if ($acc.length) updateValidationState($acc);
  },
);

// First name blur: min 3 characters (mandatory)
$(document).on(
  "blur",
  '#partnershipStep3Modal input.partner-first-name, #partnershipStep3Modal input[placeholder*="first name"]',
  function () {
    const val = $(this).val().trim();
    const $errorDiv = $(this)
      .closest(".field-wrapper")
      .find(".error-step3-handle");

    if (val.length > 0 && val.length < 3) {
      $errorDiv.find("p").text("First name must be at least 3 characters.");
      $errorDiv.show();
      $(this).addClass("is-error").removeClass("is-success");
    } else if (val.length >= 3) {
      $errorDiv.hide();
      $(this).removeClass("is-error").addClass("is-success");
    } else {
      $errorDiv.hide();
      $(this).removeClass("is-error is-success");
    }

    const $acc = $(this).closest(".partner-accordion");
    if ($acc.length) updateValidationState($acc);
  },
);

// Middle name blur: min 3 characters (optional, valid if empty)
$(document).on(
  "blur",
  '#partnershipStep3Modal input.partner-middle-name, #partnershipStep3Modal input[placeholder*="middle name"]',
  function () {
    const val = $(this).val().trim();
    const $errorDiv = $(this)
      .closest(".field-wrapper")
      .find(".error-step3-handle");

    if (val.length > 0 && val.length < 3) {
      $errorDiv.find("p").text("Middle name must be at least 3 characters.");
      $errorDiv.show();
      $(this).addClass("is-error").removeClass("is-success");
    } else if (val.length >= 3) {
      $errorDiv.hide();
      $(this).removeClass("is-error").addClass("is-success");
    } else {
      $errorDiv.hide();
      $(this).removeClass("is-error is-success");
    }

    const $acc = $(this).closest(".partner-accordion");
    if ($acc.length) updateValidationState($acc);
  },
);

// Last name blur: min 3 characters (mandatory)
$(document).on(
  "blur",
  '#partnershipStep3Modal input.partner-last-name, #partnershipStep3Modal input[placeholder*="last name"]',
  function () {
    const val = $(this).val().trim();
    const $errorDiv = $(this)
      .closest(".field-wrapper")
      .find(".error-step3-handle");

    if (val.length > 0 && val.length < 3) {
      $errorDiv.find("p").text("Last name must be at least 3 characters.");
      $errorDiv.show();
      $(this).addClass("is-error").removeClass("is-success");
    } else if (val.length >= 3) {
      $errorDiv.hide();
      $(this).removeClass("is-error").addClass("is-success");
    } else {
      $errorDiv.hide();
      $(this).removeClass("is-error is-success");
    }

    const $acc = $(this).closest(".partner-accordion");
    if ($acc.length) updateValidationState($acc);
  },
);

// Contains Mobile: numbers only, max 10
$(document).on(
  "input",
  '#partnershipStep3Modal input.partner-mobile, #partnershipStep3Modal input[placeholder="10 digit mobile number"]',
  function () {
    let clean = $(this).val().replace(/\D/g, "");
    if (clean.length > 10) clean = clean.slice(0, 10);
    $(this).val(clean);
    const $acc = $(this).closest(".partner-accordion");
    const num = $acc.data("partner");
    const errorDiv = $(this)
      .closest(".field-wrapper")
      .find(".error-step3-handle");

    if (clean.length === 10) {
      const isUnique = isFieldUniqueAcrossPartners("mobile", clean, num);
      if (!isUnique) {
        errorDiv
          .find("p")
          .text("Mobile number is already used for another partner.");
        errorDiv.show();
        $(this).addClass("is-error").removeClass("is-success");
      } else if (errorDiv.find("p").text().indexOf("already used") !== -1) {
        errorDiv.hide();
        $(this).removeClass("is-error");
      }
    } else if (errorDiv.find("p").text().indexOf("already used") !== -1) {
      errorDiv.hide();
      $(this).removeClass("is-error");
    }

    syncUniquenessAcrossAccordions("mobile");
    if ($acc.length) updateValidationState($acc);
  },
);

// Append +91 in mobile number input
$(document).on(
  "blur",
  '#partnershipStep3Modal input.partner-mobile, #partnershipStep3Modal input[placeholder="10 digit mobile number"]',
  function () {
    let clean = getCleanMobileNumber($(this).val());
    const errorDiv = $(this)
      .closest(".field-wrapper")
      .find(".error-step3-handle");
    const $acc = $(this).closest(".partner-accordion");
    const num = $acc.data("partner");

    if (clean.length > 0 && clean.length !== 10) {
      errorDiv
        .find("p")
        .text(
          "Entered mobile number is in wrong format, please enter a valid 10-digit number.",
        );
      errorDiv.show();
      $(this).addClass("is-error").removeClass("is-success");
    } else if (clean.length === 10) {
      const isUnique = isFieldUniqueAcrossPartners("mobile", clean, num);
      if (!isUnique) {
        errorDiv
          .find("p")
          .text("Mobile number is already used for another partner.");
        errorDiv.show();
        $(this).addClass("is-error").removeClass("is-success");
      } else {
        errorDiv.hide();
        $(this)
          .val("+91 " + clean)
          .removeClass("is-error")
          .addClass("is-success");
      }
    } else {
      errorDiv.hide();
      $(this).removeClass("is-error is-success");
    }

    syncUniquenessAcrossAccordions("mobile");
    if ($acc.length) updateValidationState($acc);
  },
);

// Email: no spaces, validation
$(document).on(
  "input",
  '#partnershipStep3Modal input.partner-email, #partnershipStep3Modal input[placeholder="Enter ID"]',
  function () {
    $(this).val($(this).val().replace(/\s/g, ""));
    const val = $(this).val().trim().toLowerCase();
    const $acc = $(this).closest(".partner-accordion");
    const num = $acc.data("partner");
    const errorDiv = $(this)
      .closest(".field-wrapper")
      .find(".error-step3-handle");
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

    if (isValid) {
      const isUnique = isFieldUniqueAcrossPartners("email", val, num);
      if (!isUnique) {
        errorDiv
          .find("p")
          .text("Email ID is already used for another partner.");
        errorDiv.show();
        $(this).addClass("is-error").removeClass("is-success");
      } else if (errorDiv.find("p").text().indexOf("already used") !== -1) {
        errorDiv.hide();
        $(this).removeClass("is-error");
      }
    } else if (errorDiv.find("p").text().indexOf("already used") !== -1) {
      errorDiv.hide();
      $(this).removeClass("is-error");
    }

    syncUniquenessAcrossAccordions("email");
    if ($acc.length) updateValidationState($acc);
  },
);

$(document).on(
  "blur",
  '#partnershipStep3Modal input.partner-email, #partnershipStep3Modal input[placeholder="Enter ID"]',
  function () {
    const val = $(this).val().trim().toLowerCase();
    const errorDiv = $(this)
      .closest(".field-wrapper")
      .find(".error-step3-handle");
    const $acc = $(this).closest(".partner-accordion");
    const num = $acc.data("partner");
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

    if (val.length > 0 && !isValid) {
      errorDiv
        .find("p")
        .text(
          "Entered email ID is in wrong format, please enter a valid email id.",
        );
      errorDiv.show();
      $(this).addClass("is-error").removeClass("is-success");
    } else if (isValid) {
      const isUnique = isFieldUniqueAcrossPartners("email", val, num);
      if (!isUnique) {
        errorDiv
          .find("p")
          .text("Email ID is already used for another partner.");
        errorDiv.show();
        $(this).addClass("is-error").removeClass("is-success");
      } else {
        errorDiv.hide();
        $(this).removeClass("is-error").addClass("is-success");
      }
    } else {
      errorDiv.hide();
      $(this).removeClass("is-error is-success");
    }

    syncUniquenessAcrossAccordions("email");
    if ($acc.length) updateValidationState($acc);
  },
);

// PAN: uppercase, alphanumeric, 10 chars
$(document).on(
  "input",
  '#partnershipStep3Modal input.partner-pan, #partnershipStep3Modal input[placeholder="Enter PAN"]',
  function () {
    $(this).val(
      $(this)
        .val()
        .replace(/[^a-zA-Z0-9]/g, "")
        .toUpperCase()
        .slice(0, 10),
    );
    const val = $(this).val().trim();
    const $acc = $(this).closest(".partner-accordion");
    const num = $acc.data("partner");
    const errorDiv = $(this)
      .closest(".field-wrapper")
      .find(".error-step3-handle");

    if (val.length === 10) {
      const isValid =
        /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val) || val.length === 10;
      if (isValid) {
        const isUnique = isFieldUniqueAcrossPartners("pan", val, num);
        if (!isUnique) {
          errorDiv
            .find("p")
            .text("PAN number is already used for another partner.");
          errorDiv.show();
          $(this).addClass("is-error").removeClass("is-success");
        } else if (errorDiv.find("p").text().indexOf("already used") !== -1) {
          errorDiv.hide();
          $(this).removeClass("is-error");
        }
      }
    } else if (errorDiv.find("p").text().indexOf("already used") !== -1) {
      errorDiv.hide();
      $(this).removeClass("is-error");
    }

    syncUniquenessAcrossAccordions("pan");
    if ($acc.length) updateValidationState($acc);
  },
);

$(document).on(
  "blur",
  '#partnershipStep3Modal input.partner-pan, #partnershipStep3Modal input[placeholder="Enter PAN"]',
  function () {
    const val = $(this).val().trim().toUpperCase();
    const errorDiv = $(this)
      .closest(".field-wrapper")
      .find(".error-step3-handle");
    const $acc = $(this).closest(".partner-accordion");
    const num = $acc.data("partner");
    const isValid = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val) || val.length === 10;

    if (val.length > 0 && (!isValid || val.length !== 10)) {
      errorDiv.find("p").text("Please enter a valid PAN number.");
      errorDiv.show();
      $(this).addClass("is-error").removeClass("is-success");
    } else if (val.length === 10 && isValid) {
      const isUnique = isFieldUniqueAcrossPartners("pan", val, num);
      if (!isUnique) {
        errorDiv
          .find("p")
          .text("PAN number is already used for another partner.");
        errorDiv.show();
        $(this).addClass("is-error").removeClass("is-success");
      } else {
        errorDiv.hide();
        $(this).removeClass("is-error").addClass("is-success");
      }
    } else {
      errorDiv.hide();
      $(this).removeClass("is-error is-success");
    }

    syncUniquenessAcrossAccordions("pan");
    if ($acc.length) updateValidationState($acc);
  },
);

// Pin code: digits only, autofill
$(document).on(
  "input",
  '#partnershipStep3Modal input.partner-pincode, #partnershipStep3Modal input.pincode-input, #partnershipStep3Modal input[placeholder="Enter pin code"]',
  function () {
    const clean = $(this).val().replace(/\D/g, "").slice(0, 6);
    $(this).val(clean);
    const $container = $(this).closest(".partner-accordion-content");
    if (clean.length === 6) {
      populateCityAndState($container, clean);
    }
    const $acc = $(this).closest(".partner-accordion");
    if ($acc.length) updateValidationState($acc);
  },
);

$(document).on(
  "blur",
  '#partnershipStep3Modal input.partner-pincode, #partnershipStep3Modal input.pincode-input, #partnershipStep3Modal input[placeholder="Enter pin code"]',
  function () {
    const val = $(this).val().replace(/\D/g, "");
    const errorDiv = $(this)
      .closest(".field-wrapper")
      .find(".error-step3-handle");
    const $container = $(this).closest(".partner-accordion-content");

    if (val.length > 0 && val.length !== 6) {
      errorDiv.show();
      $(this).addClass("is-error").removeClass("is-success");
    } else if (val.length === 6) {
      errorDiv.hide();
      $(this).removeClass("is-error").addClass("is-success");
      populateCityAndState($container, val);
    } else {
      errorDiv.hide();
      $(this).removeClass("is-error is-success");
    }

    const $acc = $(this).closest(".partner-accordion");
    if ($acc.length) updateValidationState($acc);
  },
);

// Address
$(document).on(
  "input",
  '#partnershipStep3Modal input.partner-address, #partnershipStep3Modal input[placeholder="Enter address"]',
  function () {
    $(this).val(
      $(this)
        .val()
        .replace(/[^a-zA-Z0-9\s,.-]/g, ""),
    );
    const $acc = $(this).closest(".partner-accordion");
    if ($acc.length) updateValidationState($acc);
  },
);

// Ownership: 1 to 100
$(document).on(
  "input",
  "#partnershipStep3Modal input.partner-ownership, #partnershipStep3Modal input.ownership-input",
  function () {
    let val = parseFloat($(this).val());
    if (val > 100) $(this).val(100);
    if (val < 0) $(this).val(0);
    const $acc = $(this).closest(".partner-accordion");
    if ($acc.length) updateValidationState($acc);
  },
);

// Focus clears error
$(document).on("focus", "#partnershipStep3Modal input", function () {
  $(this).removeClass("is-error");
  $(this).closest(".field-wrapper").find(".error-step3-handle").hide();
});

// Global listener for ANY input changes to update Save button state
$(document).on(
  "input change keyup blur paste focusout",
  "#partnershipStep3Modal .partner-accordion-content input, #partnershipStep3Modal .partner-accordion-content select",
  function () {
    const $accordion = $(this).closest(".partner-accordion");
    if ($accordion.length && !$accordion.hasClass("saved")) {
      updateValidationState($accordion);
    }
  },
);

// Accordion Validation
function isAccordionDataValid($accordion) {
  if (!$accordion || $accordion.hasClass("saved")) return true;
  const num = $accordion.data("partner");
  if (!num) return false;

  const firstName = ($("#partnerFirstName_" + num).val() || "").trim();
  const middleName = ($("#partnerMiddleName_" + num).val() || "").trim();
  const lastName = ($("#partnerLastName_" + num).val() || "").trim();
  const rawMobile = ($("#partnerMobile_" + num).val() || "").trim();
  const email = ($("#partnerEmail_" + num).val() || "").trim();
  const pan = ($("#partnerPan_" + num).val() || "").trim().toUpperCase();
  const ownership = ($("#partnerOwnership_" + num).val() || "").trim();
  const gender = (
    $("#partnerGender_" + num).val() ||
    $("#partnerGenderSpan_" + num).text() ||
    ""
  ).trim();
  const dob = ($("#partnerDob_" + num).val() || "").trim();
  const address = ($("#partnerAddress_" + num).val() || "").trim();
  const pincode = ($("#partnerPincode_" + num).val() || "").trim();
  const city = (
    $("#partnerCity_" + num).val() ||
    $("#partnerCitySpan_" + num).text() ||
    ""
  ).trim();
  const state = ($("#partnerState_" + num).val() || "").trim();
  const community = (
    $("#partnerCommunity_" + num).val() ||
    $("#partnerCommunitySpan_" + num).text() ||
    ""
  ).trim();
  const category = (
    $("#partnerCategory_" + num).val() ||
    $("#partnerCategorySpan_" + num).text() ||
    ""
  ).trim();

  // Mobile verification (10 digits & unique across partners)
  let mobileDigits = getCleanMobileNumber(rawMobile);
  const mobileValid = mobileDigits.length === 10;
  const mobileUnique = isFieldUniqueAcrossPartners("mobile", mobileDigits, num);

  // Email verification (valid format & unique across partners)
  const cleanMail = getCleanEmail(email);
  const emailValid =
    cleanMail.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanMail);
  const emailUnique = isFieldUniqueAcrossPartners("email", cleanMail, num);

  // PAN verification (10 chars, format & unique across partners)
  const cleanPan = getCleanPanNumber(pan);
  const panValid =
    cleanPan.length === 10 &&
    (/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPan) || cleanPan.length === 10);
  const panUnique = isFieldUniqueAcrossPartners("pan", cleanPan, num);

  // Ownership verification (1-100)
  const ownershipNum = parseFloat(ownership);
  const ownershipValid =
    !isNaN(ownershipNum) && ownershipNum > 0 && ownershipNum <= 100;

  // Dropdown verifications
  const genderValid =
    gender !== "" && gender !== "Select gender" && gender !== "Select";
  const communityValid =
    community !== "" &&
    community !== "Select community" &&
    community !== "Select";
  const categoryValid =
    category !== "" && category !== "Select category" && category !== "Select";

  // DOB verification
  const dobValid = dob !== "" && dob !== "Select date (yyyy-mm-dd)";

  // Pin code verification
  const cleanPin = pincode.replace(/\D/g, "");
  const pinValid = cleanPin.length === 6;

  // Name validations (min 3 characters, alphabetical; middle name optional)
  const firstNameValid =
    firstName.length >= 3 && /^[a-zA-Z\s]+$/.test(firstName);
  const middleNameValid =
    middleName.length === 0 ||
    (middleName.length >= 3 && /^[a-zA-Z\s]+$/.test(middleName));
  const lastNameValid = lastName.length >= 3 && /^[a-zA-Z\s]+$/.test(lastName);

  return (
    firstNameValid &&
    middleNameValid &&
    lastNameValid &&
    mobileValid &&
    mobileUnique &&
    emailValid &&
    emailUnique &&
    panValid &&
    panUnique &&
    ownershipValid &&
    genderValid &&
    dobValid &&
    address.length >= 1 &&
    pinValid &&
    communityValid &&
    categoryValid
  );
}

function updateValidationState($accordion) {
  if (!$accordion || $accordion.hasClass("saved")) return;
  const num = $accordion.data("partner");
  const isValid = isAccordionDataValid($accordion);
  const $btn = $("#partnerSaveBtn_" + num).length
    ? $("#partnerSaveBtn_" + num)
    : $accordion.find(".partner-save-btn");

  if (isValid) {
    $btn
      .prop("disabled", false)
      .removeAttr("disabled")
      .addClass("enabled")
      .removeClass("disabled");
  } else {
    $btn
      .prop("disabled", true)
      .attr("disabled", "disabled")
      .addClass("disabled")
      .removeClass("enabled");
  }
}

// Step 3 overall validation and submit state
function validatePartnershipStep3() {
  const $targetModal = $("#partnershipStep3Modal");
  const count = parseInt($targetModal.find("#partnerCount").val()) || 0;
  const $accordions = $targetModal.find(
    "#partnerAccordionContainer .partner-accordion",
  );
  const total = $accordions.length;
  const saved = $accordions.filter(".saved").length;

  if (!(count >= 2 && count <= 14 && total === count && saved === count)) {
    return false;
  }

  // Verify all saved partners have unique PAN, mobile, and email
  const pans = new Set();
  const mobiles = new Set();
  const emails = new Set();

  for (let i = 0; i < $accordions.length; i++) {
    const num = $($accordions[i]).data("partner");
    const pan = getCleanPanNumber($("#partnerPan_" + num).val());
    const mobile = getCleanMobileNumber($("#partnerMobile_" + num).val());
    const email = getCleanEmail($("#partnerEmail_" + num).val());

    if (pans.has(pan) || mobiles.has(mobile) || emails.has(email)) {
      return false;
    }
    if (pan) pans.add(pan);
    if (mobile) mobiles.add(mobile);
    if (email) emails.add(email);
  }

  return true;
}

function checkAllPartnersSaved() {
  const isValid = validatePartnershipStep3();
  const $targetModal = $("#partnershipStep3Modal");
  const $nextBtn = $targetModal.find("#partnershipStep3NextBtn, #step3NextBtn");
  const $saveExitBtn = $targetModal.find(
    "#partnershipSaveExitBtn, .saveExitBtn",
  );

  if (isValid) {
    $nextBtn
      .prop("disabled", false)
      .removeAttr("disabled")
      .addClass("btn-enabled")
      .removeClass("btn-disabled");
    $saveExitBtn.removeClass("disabled-link").addClass("active");
  } else {
    $nextBtn
      .prop("disabled", true)
      .attr("disabled", "disabled")
      .addClass("btn-disabled")
      .removeClass("btn-enabled");
    $saveExitBtn.addClass("disabled-link").removeClass("active");
  }
}

// Prevent some char in partnershipInput
$(document).on("keydown", "#partnerCount", function (e) {
  const blockedKey = ["e", "E", "+", "-", "."];
  if (blockedKey.includes(e.key)) {
    e.preventDefault();
  }
});

// fix by ankit Confirmation: Partner count handler with confirmation modal when reducing count
$(document).on("input change", "#partnerCount", function () {
  if ($("#partnerConfirmationModal").is(":visible")) {
    return;
  }

  let count = parseInt($(this).val()) || 0;
  const $container = $("#partnerAccordionContainer");
  let $errorDiv = $(this).siblings(".error-step3-handle");

  if (!$errorDiv.length) {
    $errorDiv = $(
      '<div class="error-step3-handle" style="display: none"><i class="material-icons">info</i><p>Please enter at least 2 partners.</p></div>',
    );
    $(this).after($errorDiv);
  }

  if (count < 2 && $(this).val() !== "") {
    $errorDiv.show();
    $(this).addClass("is-error");
  } else {
    $errorDiv.hide();
    $(this).removeClass("is-error");
  }

  if (count > 14) {
    count = 14;
    $(this).val(14);
  }

  const currentCount = $container.find(".partner-accordion").length;

  // Case 1: Increasing partner count
  if (count > currentCount) {
    if (count >= 2) {
      for (let i = currentCount + 1; i <= count; i++) {
        $container.append(getPartnerFormHtml(i));
      }
      previousPartnerCount = count;
      syncUniquenessAcrossAccordions();
      checkAllPartnersSaved();
    }
  }
  // Case 2: Decreasing partner count
  else if (count >= 2 && count < currentCount && currentCount > 0) {
    pendingPartnerReductionCount = count;
    previousPartnerCount = currentCount;
    const diffCount = currentCount - count;
    $("#partnerConfirmationModal").show();
    $(".partner-confirmation-message").text(
      `Are you sure you want to reduce the number of partners? The below ${diffCount} partner(s) details will be removed.`,
    );
  } else if (count === currentCount && count >= 2) {
    previousPartnerCount = count;
  }
});

// fix by ankit Confirmation: track accordion count on focus
$(document).on("focus", "#partnerCount", function () {
  $(this).siblings(".error-step3-handle").hide();
  $(this).removeClass("is-error");
  const current = $("#partnerAccordionContainer .partner-accordion").length;
  if (current > 0) {
    previousPartnerCount = current;
  }
});

// fix by ankit Confirmation: on blur
$(document).on("blur", "#partnerCount", function () {
  if (!$("#partnerConfirmationModal").is(":visible")) {
    const val = $(this).val();
    const count = parseInt(val) || 0;
    const actualCount = $(
      "#partnerAccordionContainer .partner-accordion",
    ).length;

    if (count < 2) {
      if (actualCount >= 2) {
        $(this).val(actualCount);
        $(this).siblings(".error-step3-handle").hide();
        $(this).removeClass("is-error");
      } else if (val === "") {
        $(this).siblings(".error-step3-handle").hide();
        $(this).removeClass("is-error");
      } else {
        $(this).siblings(".error-step3-handle").show();
        $(this).addClass("is-error");
      }
    }
  }
});

// fix by ankit Confirmation: No button click handler - do nothing, keep accordions as-is and revert input
$(document).on(
  "click",
  "#cancelPartnerBtn, #partnerConfirmationModal [data-close-modal]",
  function (e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    $("#partnerConfirmationModal").removeClass("show").hide();
    const existingCount = $(
      "#partnerAccordionContainer .partner-accordion",
    ).length;
    $("#partnerCount").val(existingCount || previousPartnerCount || "");
    $("#partnerCount").siblings(".error-step3-handle").hide();
    $("#partnerCount").removeClass("is-error");
    pendingPartnerReductionCount = null;
  },
);

// fix by ankit Confirmation: Yes button click handler - delete extra accordions from bottom
$(document).on("click", "#confirmPartnerBtn", function (e) {
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  $("#partnerConfirmationModal").removeClass("show").hide();

  let targetCount =
    pendingPartnerReductionCount !== null
      ? pendingPartnerReductionCount
      : parseInt($("#partnerCount").val()) || 0;

  if (targetCount < 2) {
    targetCount = 2;
  }
  const $container = $("#partnerAccordionContainer");
  $container.find(".partner-accordion").each(function () {
    const partnerNum = parseInt($(this).data("partner"), 10);
    if (partnerNum > targetCount) {
      $(this).remove();
    }
  });

  $("#partnerCount").siblings(".error-step3-handle").hide();
  $("#partnerCount").removeClass("is-error");
  $("#partnerCount").val(targetCount);
  previousPartnerCount = targetCount;
  pendingPartnerReductionCount = null;
  syncUniquenessAcrossAccordions();
  checkAllPartnersSaved();
});

// Accordion Toggle
$(document).on(
  "click",
  "#partnershipStep3Modal .partner-accordion-header",
  function (e) {
    e.stopPropagation();
    const $currentAccordion = $(this).closest(".partner-accordion");
    if ($currentAccordion.hasClass("saved")) return;

    const $currentContent = $currentAccordion.find(
      ".partner-accordion-content",
    );
    const isVisible = $currentContent.is(":visible");

    // Close other open accordions
    $("#partnershipStep3Modal .partner-accordion")
      .not($currentAccordion)
      .not(".saved")
      .each(function () {
        $(this).removeClass("active calendar-open");
        $(this)
          .find(".partner-accordion-content")
          .removeClass("calendar-open")
          .slideUp(200);
        $(this).find(".custom-calendar-popup").hide();
        resetAccordionCalendarSpace($(this).find(".custom-calendar-popup")[0]);
        $(this)
          .find(".partner-accordion-header i.material-icons")
          .text("expand_more");
      });

    if (isVisible) {
      $currentAccordion.removeClass("active calendar-open");
      $currentContent.removeClass("calendar-open").slideUp(200);
      $currentAccordion.find(".custom-calendar-popup").hide();
      resetAccordionCalendarSpace(
        $currentAccordion.find(".custom-calendar-popup")[0],
      );
      $(this).find("i.material-icons").text("expand_more");
    } else {
      $currentAccordion.addClass("active");
      $currentContent.slideDown(200);
      $(this).find("i.material-icons").text("expand_less");
      updateValidationState($currentAccordion);
    }
  },
);

// Save Accordion
$(document).on(
  "click",
  "#partnershipStep3Modal .partner-save-btn",
  function (e) {
    e.preventDefault();
    e.stopPropagation();
    const $accordion = $(this).closest(".partner-accordion");
    const num = $accordion.data("partner");
    console.log("Accordion", $accordion);
    console.log("Number", num);

    // Verify uniqueness before saving
    const mobileVal = getCleanMobileNumber($("#partnerMobile_" + num).val());
    const emailVal = getCleanEmail($("#partnerEmail_" + num).val());
    const panVal = getCleanPanNumber($("#partnerPan_" + num).val());

    let hasDuplicate = false;
    if (!isFieldUniqueAcrossPartners("mobile", mobileVal, num)) {
      const $err = $("#partnerMobile_" + num)
        .closest(".field-wrapper")
        .find(".error-step3-handle");
      $err.find("p").text("Mobile number is already used for another partner.");
      $err.show();
      $("#partnerMobile_" + num)
        .addClass("is-error")
        .removeClass("is-success");
      hasDuplicate = true;
    }
    if (!isFieldUniqueAcrossPartners("email", emailVal, num)) {
      const $err = $("#partnerEmail_" + num)
        .closest(".field-wrapper")
        .find(".error-step3-handle");
      $err.find("p").text("Email ID is already used for another partner.");
      $err.show();
      $("#partnerEmail_" + num)
        .addClass("is-error")
        .removeClass("is-success");
      hasDuplicate = true;
    }
    if (!isFieldUniqueAcrossPartners("pan", panVal, num)) {
      const $err = $("#partnerPan_" + num)
        .closest(".field-wrapper")
        .find(".error-step3-handle");
      $err.find("p").text("PAN number is already used for another partner.");
      $err.show();
      $("#partnerPan_" + num)
        .addClass("is-error")
        .removeClass("is-success");
      hasDuplicate = true;
    }

    if (hasDuplicate || !isAccordionDataValid($accordion)) {
      updateValidationState($accordion);
      return;
    }

    const $content = $accordion.find(".partner-accordion-content");

    const rawTitle = (
      $("#partnerTitleSpan_" + num).text() ||
      $("#partnerTitle_" + num).val() ||
      "Mr."
    ).trim();
    const title = formatPartnerTitle(rawTitle);
    const firstName = ($("#partnerFirstName_" + num).val() || "").trim();
    const middleName = ($("#partnerMiddleName_" + num).val() || "").trim();
    const lastName = ($("#partnerLastName_" + num).val() || "").trim();
    const fullName = (
      title +
      " " +
      firstName +
      (middleName ? " " + middleName : "") +
      " " +
      lastName
    ).trim();

    let mobile = ($("#partnerMobile_" + num).val() || "").trim();
    let mobileClean = mobile.replace(/\D/g, "");
    if (mobileClean.startsWith("91") && mobileClean.length === 12)
      mobileClean = mobileClean.slice(2);
    if (mobileClean.length === 10) mobile = "+91 " + mobileClean;

    const email = ($("#partnerEmail_" + num).val() || "").trim();
    const pan = ($("#partnerPan_" + num).val() || "").trim().toUpperCase();
    const ownership = ($("#partnerOwnership_" + num).val() || "").trim();

    const gender = (
      $("#partnerGender_" + num).val() ||
      $("#partnerGenderSpan_" + num).text() ||
      ""
    ).trim();
    const dob = ($("#partnerDob_" + num).val() || "").trim();

    const community = (
      $("#partnerCommunity_" + num).val() ||
      $("#partnerCommunitySpan_" + num).text() ||
      ""
    ).trim();
    const category = (
      $("#partnerCategory_" + num).val() ||
      $("#partnerCategorySpan_" + num).text() ||
      ""
    ).trim();

    const address = ($("#partnerAddress_" + num).val() || "").trim();
    const pincode = ($("#partnerPincode_" + num).val() || "").trim();
    const city = (
      $("#partnerCity_" + num).val() ||
      $("#partnerCitySpan_" + num).text() ||
      ""
    ).trim();
    const state = ($("#partnerState_" + num).val() || "").trim();

    let fullAddress = address;
    if (city && city !== "Select city") fullAddress += ", " + city;
    if (state && state !== "Not found") fullAddress += ", " + state;
    if (pincode) fullAddress += " - " + pincode;

    const summaryHtml = `
      <div class="partner-summary">
        <div class="partner-summary-grid">
          <div><p class="partner-summary-label">Name</p><p class="partner-summary-value">${fullName}</p></div>
          <div><p class="partner-summary-label">Mobile number</p><p class="partner-summary-value">${mobile}</p></div>
          <div><p class="partner-summary-label">Email ID</p><p class="partner-summary-value">${email}</p></div>
          <div><p class="partner-summary-label">PAN</p><p class="partner-summary-value">${pan}</p></div>
          <div><p class="partner-summary-label">Ownership control</p><p class="partner-summary-value">${ownership}%</p></div>
          <div><p class="partner-summary-label">Gender</p><p class="partner-summary-value">${gender}</p></div>
          <div><p class="partner-summary-label">Date of birth</p><p class="partner-summary-value">${dob}</p></div>
          <div><p class="partner-summary-label">Community</p><p class="partner-summary-value">${community}</p></div>
          <div><p class="partner-summary-label">Category</p><p class="partner-summary-value">${category}</p></div>
          <div><p class="partner-summary-label">Address</p><p class="partner-summary-value">${fullAddress}</p></div>
        </div>
      </div>`;

    $accordion.find(".partner-summary").remove();
    $accordion.find(".partner-edit-btn").remove();
    $accordion.find(".partner-accordion-header i.material-icons").hide();

    $accordion
      .find(".partner-accordion-header")
      .append(
        '<span class="partner-edit-btn"><i class="material-icons">edit</i> Edit</span>',
      );

    $accordion.find(".partner-accordion-header").after(summaryHtml);
    $accordion.addClass("saved").removeClass("active");
    $content.slideUp(200);

    syncUniquenessAcrossAccordions();
    checkAllPartnersSaved();
  },
);

// Edit Accordion
$(document).on(
  "click",
  "#partnershipStep3Modal .partner-edit-btn",
  function (e) {
    e.preventDefault();
    e.stopPropagation();

    const $accordion = $(this).closest(".partner-accordion");
    $accordion.find(".partner-summary").remove();
    $accordion.find(".partner-edit-btn").remove();
    $accordion
      .find(".partner-accordion-header i.material-icons")
      .show()
      .text("expand_less");

    $accordion.removeClass("saved").addClass("active");
    $accordion.find(".partner-accordion-content").slideDown(200);
    syncUniquenessAcrossAccordions();
    updateValidationState($accordion);
    checkAllPartnersSaved();
  },
);

// Reset Accordion
$(document).on(
  "click",
  "#partnershipStep3Modal .partner-reset-btn",
  function (e) {
    e.preventDefault();
    e.stopPropagation();

    const $accordion = $(this).closest(".partner-accordion");
    const num = $accordion.data("partner");

    if (num) {
      $("#partnerFirstName_" + num)
        .val("")
        .removeClass("is-error is-success");
      $("#partnerMiddleName_" + num)
        .val("")
        .removeClass("is-error is-success");
      $("#partnerLastName_" + num)
        .val("")
        .removeClass("is-error is-success");
      $("#partnerMobile_" + num)
        .val("")
        .removeClass("is-error is-success");
      $("#partnerEmail_" + num)
        .val("")
        .removeClass("is-error is-success");
      $("#partnerPan_" + num)
        .val("")
        .removeClass("is-error is-success");
      $("#partnerOwnership_" + num)
        .val("")
        .removeClass("is-error is-success");
      $("#partnerDob_" + num)
        .val("")
        .removeClass("is-error is-success");
      $("#partnerAddress_" + num)
        .val("")
        .removeClass("is-error is-success");
      $("#partnerPincode_" + num)
        .val("")
        .removeClass("is-error is-success");
      $("#partnerState_" + num)
        .val("")
        .removeClass("is-error is-success");

      $("#partnerTitleSpan_" + num).text("Mr.");
      $("#partnerTitle_" + num).val("Mr.");

      $("#partnerGenderSpan_" + num).text("Select gender");
      $("#partnerGender_" + num).val("");

      $("#partnerCommunitySpan_" + num).text("Select community");
      $("#partnerCommunity_" + num).val("");

      $("#partnerCategorySpan_" + num).text("Select category");
      $("#partnerCategory_" + num).val("");

      $("#partnerCitySpan_" + num).text("Select city");
      $("#partnerCity_" + num).val("");
      $("#partnerCityWrapper_" + num)
        .find(".custom-select-options")
        .empty();
      $accordion
        .find(".custom-select-options .option-item")
        .removeClass("selected");
    } else {
      $accordion.find("input").val("").removeClass("is-error is-success");
      $accordion.find("select").val("");
    }

    $accordion.find(".error-step3-handle").hide();
    $accordion.find(".cityAddressBlock").hide();

    syncUniquenessAcrossAccordions();
    updateValidationState($accordion);
  },
);

// INITIALIZATION ON READY
function resetPartnershipStep3Form() {
  pendingPartnerReductionCount = null;
  previousPartnerCount = 0;
  $("#partnerConfirmationModal").removeClass("show").hide();
  const $targetModal = $("#partnershipStep3Modal");
  $targetModal.find("#partnerCount").val("");
  $targetModal.find("#partnerAccordionContainer").empty();
  $targetModal.find(".error-step3-handle").hide();
  checkAllPartnersSaved();
}

// adding value accordion fix by Ankit
$(document).ready(function () {
  setupPartnershipDropdownHandlers();
  setupPartnershipCalendarHandlers();
  if ($("#partnershipStep3Modal").length) {
    partnershipStep3DataMappingOnLoad($("#partnershipStep3Modal"));
  }
  checkAllPartnersSaved();
});

// adding value accordion fix by Ankit
window.partnershipStep3 = {
  open: openPartnershipStep3Modal,
  close: closePartnershipStep3Modal,
  reset: resetPartnershipStep3Form,
  validate: validatePartnershipStep3,
  checkSaved: checkAllPartnersSaved,
  loadData: partnershipStep3DataMappingOnLoad,
  dummyData: dummyPartnerData,
};
window.partnershipStep3DataMappingOnLoad = partnershipStep3DataMappingOnLoad;
