console.log("Global JS Loaded");

function debounce(func, wait) {
  var timeout;
  return function executedFunction() {
    var args = arguments;
    var later = function () {
      clearTimeout(timeout);
      func.apply(this, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function initIcons() {
  if (typeof lucide !== "undefined" && lucide.createIcons) {
    lucide.createIcons();
    console.log("Lucide icons initialized");
  }
}

$(document).ready(function () {
  initIcons();
});

$(document).ajaxComplete(function (event, xhr, settings) {
  setTimeout(initIcons, 100);
});

var observerInitialized = false;
var observerDebounced = null;

function setupDOMMonitoring() {
  if (observerInitialized) return;

  observerDebounced = debounce(function () {
    var shouldInit = false;

    if ($("[data-lucide]").length > 0) {
      shouldInit = true;
    }

    if (shouldInit) {
      initIcons();
    }
  }, 200);

  $(document).on("DOMSubtreeModified", function () {
    observerDebounced();
  });

  observerInitialized = true;
}

// dashboardheader.js

var textSizeState = 1;
var lineHeightState = 1;
var letterSpacingState = 1;

var settingsChanged = false;

var defaultFontSize = 16;
var defaultLineHeight = 1.5;
var defaultLetterSpacing = 0;

const tours = {
  anchorCorporate: [
    {
      target: "#corporate-anchor",
      text: "You can view your associated anchor corporate details here. To view more details, click “View details”.",
      tooltipLeft: 524,
      arrowLeft: false,
      mobileTooltipTop: false,
    },
    {
      target: ".apply-card-footer",
      text: "You can view your loan expiry here. Your loan offer is time-bound. Apply before it expires to secure your limit.",
      tooltipLeft: 88,
      arrowLeft: true,
      tooltipPosition: "top",
      mobileTooltipTop: true,
      scrollToTop: true,
    },
    {
      target: "#openProfileView",
      mobileTarget: "#footer-profile",
      text: "You can view your profile details here.",
      tooltipLeft: 63,
      arrowLeft: false,
      arrowRight: true,
      tooltipPosition: "top",
      mobileTooltipTop: true,
    },
    {
      target: "#interestRangeBox",
      text: "You can view and check your interest rate here.",
      tooltipLeft: 88,
      arrowLeft: true,
      tooltipPosition: "top",
      mobileTooltipTop: true,
    },
  ],
};

$(document).ready(function () {
  defaultFontSize = parseFloat(getComputedStyle(document.body).fontSize);

  defaultLineHeight = 1.5;
  defaultLetterSpacing = 0;
});

$(document).on("click", "#menuToggle", function () {
  $("#mobileDrawer").toggleClass("open");

  const isOpen = $("#mobileDrawer").hasClass("open");

  $(this).html(
    isOpen
      ? '<i data-lucide="chevron-left" style="color: #fff"></i>'
      : '<i data-lucide="menu" style="color: #fff"></i>',
  );

  lucide.createIcons();
});

function closeSidePanels() {
  $("#notificationPanel").removeClass("open");
  $("#helpPanel").removeClass("open");

  $("#sidePanelOverlay").removeClass("show");
}

$(document).on(
  "click",
  "#openNotificationPanel, #openNotificationPanelMobile",
  function () {
    closeSidePanels();

    $("#notificationPanel").addClass("open");
    $("#sidePanelOverlay").addClass("show");
  },
);

$(document).on("click", "#openHelpPanel, #openHelpPanelMobile", function () {
  closeSidePanels();

  $("#helpPanel").addClass("open");
  $("#sidePanelOverlay").addClass("show");
});

$(document).on("click", ".close-panel", function () {
  closeSidePanels();
});

$(document).on("click", "#sidePanelOverlay", function () {
  closeSidePanels();
});

// Tabs

$(document).on("click", ".help-tab", function () {
  const tab = $(this).data("tab");

  $(".help-tab").removeClass("active");
  $(this).addClass("active");

  $(".tab-content").removeClass("active");

  if (tab === "chat") {
    $("#chatTab").addClass("active");
  }

  if (tab === "faq") {
    $("#faqTab").addClass("active");
  }

  if (tab === "tour") {
    $("#tourTab").addClass("active");
  }
});

// FAQ

$(document).on("click", ".faq-question", function () {
  const item = $(this).closest(".faq-item");

  item.toggleClass("open");

  item.find(".faq-answer").slideToggle(200);
});

$(document).on("click", "#openRelationshipManager", function () {
  $("#relationshipManagerModal").css("display", "flex");
});

$(document).on(
  "click",
  "#openAccessibilityModal,#openAccessibilityModalMobile",
  function (e) {
    e.stopPropagation();

    if ($(window).width() < 768) {
      if ($("#accessibilityPanel").is(":visible")) {
        $("#accessibilityPanel").hide();
        $("#accessibilityOverlay").removeClass("show");
      } else {
        $("#accessibilityPanel").show();
        $("#accessibilityOverlay").addClass("show");
      }
    } else {
      $("#accessibilityPanel").toggle();
    }
  },
);

$(document).on("click", function (e) {
  if (
    !$(e.target).closest("#accessibilityPanel").length &&
    !$(e.target).closest("#openAccessibilityModal").length &&
    !$(e.target).closest("#openAccessibilityModalMobile").length
  ) {
    if ($(window).width() < 768) {
      $("#accessibilityPanel").hide();
      $("#accessibilityOverlay").removeClass("show");
    } else {
      $("#accessibilityPanel").hide();
    }
  }
});

$(document).on("click", "[data-close-modal]", function () {
  $(".custom-modal-overlay").css("display", "none");
});

$(document).on("click", ".custom-modal-overlay", function (e) {
  if ($(e.target).hasClass("custom-modal-overlay")) {
    $(this).css("display", "none");
  }
});

$(document).on("click", "#openLogoutModal", function () {
  $("#logoutModal").show();
});

$(document).on("click", "#proceedBtn", function () {
  $("#logoutModal").hide();

  $("#logoutSuccessScreen").hide();
  $("#mobileLogoutSuccessScreen").hide();

  if ($(window).width() < 768) {
    $("#mobileLogoutSuccessScreen").css("display", "flex");
    $("#dashboardContent").show();
    $(".empty-state").show();
  } else {
    $("#logoutSuccessScreen").css("display", "block");
    $("#dashboardContent").hide();
    $(".empty-state").hide();
  }

  lucide.createIcons();
});

function applyAccessibilitySettings() {
  let fontSize = defaultFontSize;
  let lineHeight = defaultLineHeight;
  let letterSpacing = defaultLetterSpacing;

  // Text size
  if (textSizeState === 0) {
    fontSize = defaultFontSize - 2;
  } else if (textSizeState === 2) {
    fontSize = defaultFontSize + 2;
  }

  // Line height
  if (lineHeightState === 0) {
    lineHeight = defaultLineHeight - 0.2;
  } else if (lineHeightState === 2) {
    lineHeight = defaultLineHeight + 0.2;
  }

  // Letter spacing
  if (letterSpacingState === 0) {
    letterSpacing = defaultLetterSpacing - 1;
  } else if (letterSpacingState === 2) {
    letterSpacing = defaultLetterSpacing + 1;
  }

  $("body").css({
    fontSize: fontSize + "px",
  });

  $("body, body *").css({
    lineHeight: lineHeight,
    letterSpacing: letterSpacing + "px",
  });
}

$("#applyAccessibility").on("click", function () {
  applyAccessibilitySettings();

  $("body").toggleClass(
    "high-contrast",
    $("#highContrastToggle").is(":checked"),
  );

  disableAccessibilityButtons();

  $("#accessibilityPanel").hide();

  if ($(window).width() < 768) {
    $("#accessibilityOverlay").removeClass("show");
  }
});

$(document).on("click", "#accessibilityOverlay", function () {
  $("#accessibilityPanel").hide();
  $(this).removeClass("show");
});

$(document).ready(function () {
  const settings = JSON.parse(localStorage.getItem("accessibilitySettings"));

  if (settings) {
    textSizeState = settings.textSizeState;
    lineHeightState = settings.lineHeightState;
    letterSpacingState = settings.letterSpacingState;

    updateTextSizeUI();
    updateLineHeightUI();
    updateLetterSpacingUI();

    applyAccessibilitySettings();
  }

  disableAccessibilityButtons();
});

function enableAccessibilityButtons() {
  settingsChanged = true;

  $("#applyAccessibility").prop("disabled", false).css({
    background: "#E3530F",
    color: "#fff",
    border: "1px solid #E3530F",
    cursor: "pointer",
  });

  $("#resetAccessibility").prop("disabled", false).css({
    color: "#E3530F",
    border: "1px solid #E3530F",
    cursor: "pointer",
  });
}

function disableAccessibilityButtons() {
  settingsChanged = false;

  $("#applyAccessibility").prop("disabled", true).css({
    background: "#D2D2D2",
    color: "#6F6F6F",
    border: "1px solid #D2D2D2",
    cursor: "not-allowed",
  });

  $("#resetAccessibility").prop("disabled", true).css({
    color: "#6F6F6F",
    border: "1px solid #D2D2D2",
    cursor: "not-allowed",
  });
}

$(document).on("change", "#highContrastToggle", function () {
  enableAccessibilityButtons();
});

$("#resetAccessibility").on("click", function () {
  textSizeState = 1;
  lineHeightState = 1;
  letterSpacingState = 1;

  updateTextSizeUI();
  updateLineHeightUI();
  updateLetterSpacingUI();

  $("#highContrastToggle").prop("checked", false);

  $("body").css({
    fontSize: "",
    lineHeight: "",
    letterSpacing: "",
  });

  $("body").removeClass("high-contrast");

  localStorage.removeItem("accessibilitySettings");

  disableAccessibilityButtons();
});

$(document).on("keyup", "#faqSearch", function () {
  const value = $(this).val().toLowerCase().trim();

  $(".faq-item").each(function () {
    const text = $(this).text().toLowerCase();

    if (text.includes(value)) {
      $(this).show();
    } else {
      $(this).hide();
    }
  });
});

$(document).on("keyup", "#tourSearch", function () {
  const value = $(this).val().toLowerCase().trim();

  $(".tour-item").each(function () {
    const text = $(this).text().toLowerCase();

    if (text.includes(value)) {
      $(this).show();
    } else {
      $(this).hide();
    }
  });
});

function updateTextSizeUI() {
  const buttons = $(".setting-row").eq(0).find(".setting-controls button");

  buttons.removeClass("active");

  if (textSizeState === 0) {
    buttons.eq(1).addClass("active");
    buttons.eq(0).prop("disabled", true);
    buttons.eq(4).prop("disabled", false);
  } else if (textSizeState === 1) {
    buttons.eq(2).addClass("active");
    buttons.eq(0).prop("disabled", false);
    buttons.eq(4).prop("disabled", false);
  } else {
    buttons.eq(3).addClass("active");
    buttons.eq(0).prop("disabled", false);
    buttons.eq(4).prop("disabled", true);
  }
}

function updateLineHeightUI() {
  const buttons = $(".setting-row").eq(1).find(".setting-controls button");

  buttons.removeClass("active");

  if (lineHeightState === 0) {
    buttons.eq(1).addClass("active");
    buttons.eq(0).prop("disabled", true);
    buttons.eq(4).prop("disabled", false);
  } else if (lineHeightState === 1) {
    buttons.eq(2).addClass("active");
    buttons.eq(0).prop("disabled", false);
    buttons.eq(4).prop("disabled", false);
  } else {
    buttons.eq(3).addClass("active");
    buttons.eq(0).prop("disabled", false);
    buttons.eq(4).prop("disabled", true);
  }
}

function updateLetterSpacingUI() {
  const buttons = $(".setting-row").eq(2).find(".setting-controls button");

  buttons.removeClass("active");

  if (letterSpacingState === 0) {
    buttons.eq(1).addClass("active");
    buttons.eq(0).prop("disabled", true);
    buttons.eq(4).prop("disabled", false);
  } else if (letterSpacingState === 1) {
    buttons.eq(2).addClass("active");
    buttons.eq(0).prop("disabled", false);
    buttons.eq(4).prop("disabled", false);
  } else {
    buttons.eq(3).addClass("active");
    buttons.eq(0).prop("disabled", false);
    buttons.eq(4).prop("disabled", true);
  }
}

$(document).on("click", ".increase-font", function () {
  if (textSizeState < 2) {
    textSizeState++;
    updateTextSizeUI();
    enableAccessibilityButtons();
  }
});

$(document).on("click", ".decrease-font", function () {
  if (textSizeState > 0) {
    textSizeState--;
    updateTextSizeUI();
    enableAccessibilityButtons();
  }
});

$(document).on("click", ".increase-line", function () {
  if (lineHeightState < 2) {
    lineHeightState++;
    updateLineHeightUI();
    enableAccessibilityButtons();
  }
});

$(document).on("click", ".decrease-line", function () {
  if (lineHeightState > 0) {
    lineHeightState--;
    updateLineHeightUI();
    enableAccessibilityButtons();
  }
});

$(document).on("click", ".increase-spacing", function () {
  if (letterSpacingState < 2) {
    letterSpacingState++;
    updateLetterSpacingUI();
    enableAccessibilityButtons();
  }
});

$(document).on("click", ".decrease-spacing", function () {
  if (letterSpacingState > 0) {
    letterSpacingState--;
    updateLetterSpacingUI();
    enableAccessibilityButtons();
  }
});

let activeTour = [];
let currentTourStep = 0;

function startTour(tourName) {
  activeTour = tours[tourName];
  currentTourStep = 0;

  $("body").css("overflow", "hidden");

  $("#tourOverlay").show();

  showTourStep();
}

function stopTour() {
  $("#tourOverlay").hide();

  $("body").css("overflow", "");

  activeTour = [];
  currentTourStep = 0;
}

function showTourStep() {
  const step = activeTour[currentTourStep];

  if (!step) {
    stopTour();
    return;
  }

  const selector =
    $(window).width() < 768 && step.mobileTarget
      ? step.mobileTarget
      : step.target;

  const target = document.querySelector(selector);

  if (!target) {
    console.log("Target not found:", selector);
    return;
  }

  if (step.scrollToTop) {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  setTimeout(
    () => {
      target.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      setTimeout(() => {
        positionTour(target, step);
      }, 300);
    },
    step.scrollToTop ? 400 : 0,
  );
}

function positionTour(target, step) {
  const rect = target.getBoundingClientRect();

  $("#tourHighlight").css({
    position: "fixed",
    top: rect.top - 8,
    left: rect.left - 8,
    width: rect.width + 16,
    height: rect.height + 16,
    zIndex: 20001,
  });

  $("#tourTooltipContent").html(step.text);

  $("#tourStepText").text(`Step ${currentTourStep + 1}/${activeTour.length}`);

  const isMobile = $(window).width() < 768;

  const tooltipTop =
    isMobile && step.mobileTooltipTop
      ? rect.top - $("#tourTooltip").outerHeight() - 20
      : rect.bottom + 20;

  $("#tourTooltip").css({
    position: "fixed",
    top: tooltipTop,
    left:
      step.tooltipLeft ||
      Math.max(
        20,
        rect.left + rect.width / 2 - $("#tourTooltip").outerWidth() / 2,
      ),
    zIndex: 20002,
  });

  $("#tourTooltip").toggleClass("arrow-left", step.arrowLeft === true);
  $("#tourTooltip").toggleClass(
    "arrow-right",
    isMobile && step.arrowRight === true,
  );

  $("#tourTooltip").toggleClass(
    "tooltip-top",
    isMobile && step.mobileTooltipTop,
  );
}

$(document).on("click", "#tourNext", function () {
  currentTourStep++;

  if (currentTourStep >= activeTour.length) {
    stopTour();
    return;
  }

  showTourStep();
});

$(document).on("click", "#tourSkip, #tourClose", function () {
  stopTour();
});

$(document).on("click", ".tour-item", function () {
  const text = $(this).text().trim();
  closeSidePanels();

  if (
    text === "Explore the anchor corporate details" ||
    text == "How to check offer validity?" ||
    text == "How can you view your profile details?" ||
    text == "How can you check your interest rate range?"
  ) {
    startTour("anchorCorporate");
  }
});

$(document).on("click", ".copy-contact", function () {
  const value = $(this).siblings("span").text().trim();
  const $icon = $(this);

  navigator.clipboard.writeText(value).then(function () {
    $icon.html(
      '<i class="copy-icon" data-lucide="check"  style="color: #e3530f; cursor: pointer"></i>',
    );
    lucide.createIcons();

    setTimeout(function () {
      $icon.html(
        '<span class="copy-icon material-icons" style="color: #e3530f; cursor: pointer">content_copy</span>',
      );
      lucide.createIcons();
    }, 500);
  });
});

$(document).ready(function () {
  $(".getInTouchBtn").on("click", function (e) {
    e.stopPropagation();
    $(".getTouchDropdown").toggleClass("show");
  });

  $(document).on("click", function (e) {
    if (
      !$(e.target).closest(".getTouchDropdown").length &&
      !$(e.target).closest(".getInTouchBtn").length
    ) {
      $(".getTouchDropdown").removeClass("show");
    }
  });
});

// Toast.js

$(document).on("click", ".download-btn", function (e) {
  e.preventDefault();
  e.stopPropagation();

  const btn = $(this);

  btn.find(".download-loader").removeClass("d-none");
  btn.find("i, #download-text, #download-icon").hide();

  setTimeout(function () {
    btn.find(".download-loader").addClass("d-none");
    btn.find("i, #download-text, #download-icon").show();

    showToast(
      "success",
      "Download successful",
      "Sanction letter document has been downloaded successfully",
    );
  }, 1500);
});

function showToast(type, title, message) {
  const $toast = $("#downloadToast");

  if (!$toast.length) {
    console.error("Toast element not found!");
    return;
  }

  const iconName = type === "success" ? "check-circle" : "x-circle";

  $toast.removeClass("success error").addClass(type);
  $toast.find(".toast-title").text(title);
  $toast.find(".toast-message").text(message);

  const $iconContainer = $toast.find(".toast-icon");
  $iconContainer.empty();
  $iconContainer.html(
    `<i data-lucide="${iconName}" class="toast-icon-svg"></i>`,
  );

  if (typeof lucide !== "undefined" && lucide.createIcons) {
    lucide.createIcons();
  }

  $toast.stop(true, true).css("opacity", 0).show();
  $("#downloadToast").addClass("toast-flex");

  $toast
    .animate({ opacity: 1 }, 300)
    .delay(3000)
    .fadeOut(300, function () {
      $(this).removeClass("toast-flex");
    });
}
