/* ==========================================================================
   ICICI SCF - DEALER PARTNERSHIP FLOW MAIN JAVASCRIPT (CLEAN & DEDUPLICATED)
   File: scf-patnership.js
   Description: Fully deduplicated, modularized, and cleanly documented JavaScript file.
                Combines 100% of functionality from dealer-dashboard-partnership.js
                and dashboardTabFunction.js with 0 duplicate functions or event handlers.

   STEP-BY-STEP MAP & FUNCTION GUIDE:
   - SECTION 1: GLOBAL DEMO STATES & CONFIGURATION FLAGS
   - SECTION 2: ACCESSIBILITY & KEYBOARD NAVIGATION MODULE (Deduplicated Modal Focus Traps)
   - SECTION 3: UTILITY & FORMATTING HELPERS (Indian Currency, Account #, Dates, Uppercase)
   - SECTION 4: STEPPER & GLOBAL NAVIGATION (updateStepper, updateProgress, Save & Exit)
   - SECTION 5: STEP 1 - ENTITY & PARTNER DETAILS (GST, URC, Partner Accordion, LEI)
   - SECTION 6: STEP 2 - PROPRIETOR / PARTNER KYC & PERSONAL DETAILS
   - SECTION 7: STEP 3 - BANK STATEMENT, ITR & ACCOUNT SELECTION (Bank forms, City/State, Datepickers)
   - SECTION 8: STEP 4 - SANCTION OFFER, E-SIGN & OTP VERIFICATION (Terms Scroll, E-Sign, OTP Timer)
   - SECTION 9: MODALS, DRAWERS, HEADER & DOCUMENT READY INITIALIZATION
   ========================================================================== */

/* ==========================================================================
   SECTION 2: REUSABLE ACCESSIBILITY & KEYBOARD NAVIGATION MODULE
   Single, unified, deduplicated focus trap & keyboard listener for all modals.
   (Consolidated from dashboardTabFunction.js)
   ========================================================================== */

(function () {
  "use strict";

  const FOCUSABLE_ELEMENTS = [
    "button:not([disabled])",
    "a[href]:not(.disabled-link)",
    'input:not([disabled]):not([type="hidden"])',
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
    ".verify-link",
    ".switch input",
    ".custom-select-trigger",
    ".upload-drop-zone",
    ".save-bank-btn",
    ".reset-bank",
  ];

  let isModalOpen = false;
  let currentFocusIndex = 0;
  let focusableElements = [];
  let lastFocusedElement = null;

  const ALL_MODALS_SELECTOR = "#step1Modal, #step2Modal, #step3Modal, #step4Modal, .custom-modal-overlay";

  function getFocusableElements(modal) {
    if (!modal || !modal.length) return [];
    return modal.find(FOCUSABLE_ELEMENTS.join(",")).filter(":visible").toArray();
  }

  function isFocusableElement(element) {
    return $(element).is(":visible") && !$(element).prop("disabled");
  }

  function setupModalFocus(modalSelector) {
    const activeModal = modalSelector ? $(modalSelector) : $(ALL_MODALS_SELECTOR).filter(":visible").first();
    if (!activeModal.length) return;

    lastFocusedElement = document.activeElement;
    focusableElements = getFocusableElements(activeModal);
    currentFocusIndex = 0;
    isModalOpen = true;

    if (focusableElements.length > 0) {
      setTimeout(() => {
        focusableElements[0].focus();
      }, 100);
    }
  }

  function handleTabNavigation(e) {
    if (!isModalOpen || focusableElements.length === 0) return;

    if (e.shiftKey) {
      currentFocusIndex = (currentFocusIndex - 1 + focusableElements.length) % focusableElements.length;
    } else {
      currentFocusIndex = (currentFocusIndex + 1) % focusableElements.length;
    }

    e.preventDefault();
    focusableElements[currentFocusIndex].focus();
  }

  function handleEnterNavigation(e) {
    const activeEl = document.activeElement;
    if (activeEl && $(activeEl).is("button, a, .verify-link, .custom-select-trigger")) {
      activeEl.click();
    }
  }

  function handleArrowNavigation(e) {
    if (!isModalOpen || focusableElements.length === 0) return;
    const activeEl = document.activeElement;
    const index = focusableElements.indexOf(activeEl);
    if (index === -1) return;

    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      const nextIndex = (index + 1) % focusableElements.length;
      focusableElements[nextIndex].focus();
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      const prevIndex = (index - 1 + focusableElements.length) % focusableElements.length;
      focusableElements[prevIndex].focus();
    }
  }

  function handleEscapeNavigation(e) {
    const visibleModal = $(ALL_MODALS_SELECTOR).filter(":visible").first();
    if (visibleModal.length) {
      visibleModal.hide();
      isModalOpen = false;
      if (lastFocusedElement) {
        lastFocusedElement.focus();
      }
    }
  }

  function initKeyboardNavigation() {
    $(document).on("click", "#applySanctionProceedBtn, [data-open-modal]", function () {
      setTimeout(() => {
        setupModalFocus();
      }, 300);
    });

    $(document).on("click", ".journey-close, [data-close-modal]", function () {
      const modal = $(this).closest(ALL_MODALS_SELECTOR);
      if (modal.is(":visible")) {
        modal.hide();
        isModalOpen = false;
        if (lastFocusedElement) lastFocusedElement.focus();
      }
    });

    $(document).on("keydown", function (e) {
      if (!isModalOpen) return;
      if (e.key === "Tab") handleTabNavigation(e);
      else if (e.key === "Escape") handleEscapeNavigation(e);
      else if (e.key === "Enter") handleEnterNavigation(e);
      else if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) handleArrowNavigation(e);
    });
  }

  $(document).ready(function () {
    initKeyboardNavigation();
  });
})();


// true  = Contract generation in progress
// false = Normal e-sign flow
var isContractGenerationInProgress = false;

// true = Single signee flow
// false = Partner flow
var isSingleSignee = true;

// true = Loan application under review flow
// false = Normal flow
var isApplicationUnderReview = false;

// true = Loan application rejected flow
// false = Normal flow
var isApplicationRejected = false;

// true = GSTIN verification success
// false = GSTIN verification error
var isGstSuccess = false;

// true = URC verification success
// false = URC verification error
var isUrcSuccess = false;

// true = Show GST Tradename mismatch flow
// false = Normal flow (Apply sanction -> Terms -> Step 1)
var showGstTradename = false;

// true = System failure flow
// false = Normal flow (Apply sanction -> Terms -> Step 1)
var isSystemFailure = false;

let currentStepModalId = null;

const validGstUsername = "GSTUSER12345678";
const validIncorporationDate = "2019-07-15";
const validUrcNumber = "UDYAM-XX-00-1234567";

var selectedPartner = null;
let otpTimers = {};

function siblingErrorDiv(el) {
  var $el = $(el);
  var err = $el.siblings(".error-step3-handle");
  if (!err.length) err = $el.parent().siblings(".error-step3-handle");
  if (!err.length)
    err = $el.closest(".field-wrapper").find(".error-step3-handle");
  return err;
}

/* ==================== STEP 4: SANCTION OFFER, E-SIGN & OTP VERIFICATION (END) ==================== */

/* ==================== MODALS, DRAWERS, HEADER & INITIALIZATION (START) ====================
   Registers all click events, modal triggers, drawer actions, header dropdowns,
   and skeleton loading transitions upon DOM ready.
   ========================================================================================= */

$(document).ready(function () {
  $(document).on("input", ".ownership-input", function () {
    $(this).val(
      $(this)
        .val()
        .replace(/[^0-9.]/g, ""),
    );
  });

  $(document).on("click", "#toggleEsign", function () {
    $("#partnerDetails").slideToggle(250);

    if ($(this).text().trim() === "View details") {
      $(this).html(
        '<span class="view-btn">Hide details</span> <i data-lucide="chevron-up" class="chevron-icon"></i>',
      );
    } else {
      $(this).html(
        '<span class="view-btn">View details</span> <i data-lucide="chevron-down" class="chevron-icon"></i>',
      );
    }

    if (typeof lucide !== "undefined" && lucide.createIcons) {
      lucide.createIcons();
    }
  });
});

function updateStepper(stage) {
  $(".step-item").removeClass("active current");

  $(".step-circle").each(function (index) {
    $(this).text(index + 1);
  });

  if (stage === 1) {
    $("#step1").addClass("active");
    $("#step2").addClass("current");
  }

  if (stage === 2) {
    $("#step1,#step2,#step3").addClass("active");
    $("#step4").addClass("current");
  }

  if (stage === 3) {
    $("#step1,#step2,#step3,#step4").addClass("active");
    $("#step5").addClass("current");
  }

  if (stage === 4) {
    $("#step1,#step2,#step3,#step4,#step5,#step6").addClass("active");
  }

  if (stage === 5) {
    $(".step-item").addClass("active");

    $(".step-circle").html(
      '<i class="check-icon material-symbols-outlined">check</i>',
    );

    $(".stepper-progress").addClass("complete");
  }

  $(".step-item.active").each(function () {
    $(this)
      .find(".step-circle")
      .html('<i class="check-icon material-symbols-outlined">check</i>');
  });

  updateProgress(stage);

  $(".step-item.active .step-circle, .step-item.current .step-circle").text("");
  $(".step-item.active .step-circle").html(
    '<i class="check-icon material-symbols-outlined">check</i>',
  );

  if (typeof lucide !== "undefined" && lucide.createIcons) {
    lucide.createIcons();
  }
}

var currentStage = 1;

$(document).ready(function () {
  if (!isApplicationRejected) {
    updateStepper(1);
  }

  $(document).on("click", "#applyBtn", function () {
    // if (currentStage === 1) {
    //   currentStage = 2;

    //   updateStepper(2);

    //   $("#step2 .step-label").text("Applied");
    //   $("#step3 .step-label").text("Sanction approved");

    //   $("#rateOfInterestBox").show();

    //   $("#interestRangeBox").hide();

    //   $(".gap-add").addClass('gap-wide');

    //   $("#sanctionDateBox").show();
    //   $("#sanctionDateBox .loan-label").text("Saction date");

    //   $("#limitExpiryBox").show();
    //   $("#limitExpiryBox .loan-label").text("Saction validity date");

    //   $("#loanOfferBadge").addClass('badge-kyc-pending');
    //   $("#loanOfferBadge").text("KYC pending");

    //   $("#cardFooterTitle").text("KYC pending");

    //   $("#processingFeeValue").html(`
    //     ₹10,000.00
    //     <span class="loan-rupee">
    //       + GST
    //     </span>
    //   `);

    //   toggleProcessingFeeBox();

    //   $("#loan-word").text("Sanctioned limit");
    //   $(".text-end-part")
    //     .removeClass("text-end-part")
    //     .addClass("text-start-part");

    //   $("#cardFooterText").text(
    //     "Your ICICI Bank relationship manager will contact you shortly for KYC verification",
    //   );

    //   $("#cardFooterBadge").hide();

    //   $(this).hide();

    //   setTimeout(function () {
    //     currentStage = 3;

    //     updateStepper(3);

    //     $("#cardFooterTitle").html(`
    //       eSign pending
    //       <i
    //         data-lucide="info"
    // class="icon-css"
    //       ></i>
    //     `);

    //     if (typeof lucide !== "undefined") {
    //       lucide.createIcons();
    //     }

    //     $("#loanOfferBadge").text("eSign pending");

    //     toggleProcessingFeeBox();

    //     if (isContractGenerationInProgress) {
    //       $("#cardFooterText").text(
    //         "Your contract generation for the document e-signing is currently in progress.",
    //       );

    //       $("#applyBtn")
    //         .text("Proceed to eSign")
    //         .prop("disabled", true)
    //         .addClass('btn-disabled')
    //         .show();
    //     } else {
    //       $("#cardFooterText").html(
    //         "Signatory: <strong>Gayatri Lakshmi Ronda</strong>",
    //       );

    //       $("#applyBtn")
    //         .text("Proceed to eSign")
    //         .prop("disabled", false)
    //         .addClass('btn-enabled')
    //         .show();
    //     }

    //     $("#dashboardDocuments").show();

    //     $("#currentAccount").show();
    //   }, 5000);

    //   return;
    // }

    if (currentStage === 3) {
      if (isSingleSignee) {
        $("#partnerEsignProceedBtn").show();

        $("#esignRedirectModal").show();

        if (typeof lucide !== "undefined") {
          lucide.createIcons();
        }
      } else {
        $("#cardFooterSection").each(function () {
          $(this).removeClass("d-flex").addClass("d-none").hide();
        });

        $("#dashboardEsign").show();
      }

      return;
    }
  });

  $(document).on("click", "#mainEsignBtn", function () {
    $(this).hide();

    $("#esignMainSigner").hide();

    $("#esignPendingSection").hide();

    $("#partnerDetails").show();

    $("#esignPendingSection").each(function () {
      $(this).removeClass("d-flex").addClass("").addClass("d-none");
    });

    $(".partner-disabled").removeClass("partner-disabled");
    $(".partner-status-bg").removeClass("partner-status-bg");

    $("#partnerDetails").each(function () {
      $(this).addClass("partner-details-padded");
    });

    $(".partner-status.pending-text").each(function () {
      $(this)
        .removeClass("pending-text")
        .addClass("esign-user")
        .html('Proceed to eSign <i data-lucide="arrow-up-right"></i>');
    });

    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }
  });

  $(document).on("click", ".esign-user", function () {
    selectedPartner = $(this);

    $("#partnerEsignProceedBtn").show();

    $("#esignRedirectModal").show();

    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }
  });

  $(document).on("click", "#partnerEsignProceedBtn", function () {
    if (!selectedPartner) return;

    selectedPartner
      .removeClass("esign-user pending-text")
      .addClass("green-text")
      .html(
        'eSigned <i data-lucide="circle-check" class="chevron-icon info-icon check-icon-circle" data-tooltip="eSigned"></i>',
      );

    $("#esignRedirectModal").fadeOut(200);

    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }

    if ($(".esign-user").length === 0) {
      currentStage = 4;

      updateStepper(4);

      $("#dashboardEsign").hide();

      $("#limitSetupSection").show();

      $(".dashboardCardHigh").hide();

      toggleMobileAccountActions();

      $("#processingFeeBox").hide();

      // const sanctionedLimit = 10000000;
      // const availableAmount = 7000000;
      // const outstandingAmount = 3000000;

      const sanctionedLimit = 10000000;
      const availableAmount = 10000000;
      const outstandingAmount = 0;

      updateAccountProgress(
        availableAmount,
        outstandingAmount,
        sanctionedLimit,
      );

      renderLimitBottomSection(
        sanctionedLimit,
        availableAmount,
        outstandingAmount,
      );

      $("#footerBalanceSection").each(function () {
        $(this).removeClass("").addClass("d-flex");
      });

      toggleMobileAccountActions();

      $("#dashboard-card-top").hide();

      $("#cardFooterSection").hide();
    }

    selectedPartner = null;
  });

  $(document).on("click", "#closeEsignModal", function () {
    $("#esignRedirectModal").fadeOut(200);

    if (isSingleSignee) {
      completeEsignFlow();
      return;
    }

    if (selectedPartner) {
      selectedPartner
        .removeClass("esign-user pending-text")
        .addClass("green-text")
        .html(
          'eSigned <i data-lucide="circle-check" class="chevron-icon info-icon check-icon-circle" data-tooltip="eSigned"></i>',
        );

      if (typeof lucide !== "undefined") {
        lucide.createIcons();
      }

      selectedPartner = null;
    }

    if ($(".esign-user").length === 0) {
      completeEsignFlow();
    }
  });
});

function completeEsignFlow() {
  currentStage = 4;

  updateStepper(4);

  $("#dashboardEsign").hide();
  $("#cardFooterSection").each(function () {
    $(this).removeClass("d-flex").addClass("d-none").hide();
  });

  $("#limitSetupSection").show();

  $(".dashboardCardHigh").hide();

  toggleMobileAccountActions();

  const sanctionedLimit = 10000000;
  const availableAmount = 10000000;
  const outstandingAmount = 0;

  updateAccountProgress(availableAmount, outstandingAmount, sanctionedLimit);

  renderLimitBottomSection(sanctionedLimit, availableAmount, outstandingAmount);

  $("#footerBalanceSection").addClass("d-flex");

  $("#dashboard-card-top").hide();
  $("#cardFooterSection").hide();
}

function updateProgress(stage) {
  var isMobile = $(window).width() < 768;
  var stageClass = getProgressClass(stage, isMobile);

  $(".stepper-progress")
    .removeClass(
      "progress-20 progress-22 progress-58 progress-62 progress-75 progress-80 progress-100",
    )
    .addClass(stageClass);
}

function getProgressClass(stage, isMobile) {
  if (isMobile) {
    switch (stage) {
      case 1:
        return "progress-22";
      case 2:
        return "progress-58";
      case 3:
        return "progress-75";
      case 4:
      case 5:
        return "progress-100";
      default:
        return "progress-0";
    }
  } else {
    switch (stage) {
      case 1:
        return "progress-20";
      case 2:
        return "progress-62";
      case 3:
        return "progress-80";
      case 4:
      case 5:
        return "progress-100";
      default:
        return "progress-0";
    }
  }
}

$(document).on("click", "#documentsToggle", function () {
  $("#documentsContent").slideToggle(250, function () {
    const isOpen = $(this).is(":visible");

    $("#documentsArrow").attr(
      "data-lucide",
      isOpen ? "chevron-up" : "chevron-down",
    );

    lucide.createIcons();
  });
});

let accountVisible = false;

$(document).on("click", "#toggleAccountDetails", function () {
  accountVisible = !accountVisible;

  if (accountVisible) {
    // const sanctionedLimit = 10000000;
    // const availableAmount = 7000000;
    // const outstandingAmount = 3000000;

    const sanctionedLimit = 10000000;
    const availableAmount = 10000000;
    const outstandingAmount = 0;

    $(".account-number-value").text("2223 1154 8754");

    $(".available-amount-value").html(
      `₹${availableAmount.toLocaleString("en-IN")}.<small class="decimal-amount">00</small>`,
    );

    $(".outstanding-amount-value").html(
      `₹${outstandingAmount.toLocaleString("en-IN")}.<small class="decimal-amount">00</small>`,
    );

    $(".sanction-limit-value").html(
      `₹${sanctionedLimit.toLocaleString("en-IN")}.<small class="decimal-amount">00</small>`,
    );

    $(".saction-limiy-value-words").show();
    $(".percentage-block").show();

    if ($(window).width() < 768) {
      $(".first-card").each(function () {
        this.style.setProperty("gap", "105px", "important");
      });
    }

    $(this).html('Hide details <i data-lucide="eye-off"></i>');
  } else {
    $(".account-number-value").text("xxxx xxxx 8754");

    $(".available-amount-value").text("₹xxxxxxxxxx");

    $(".outstanding-amount-value").text("₹xxxxxxxxxx");

    $(".sanction-limit-value").text("₹xxxxxxxxxx");

    $(".saction-limiy-value-words").hide();
    $(".percentage-block").hide();

    // const sanctionedLimit = 10000000;
    // const availableAmount = 7000000;
    // const outstandingAmount = 3000000;

    const sanctionedLimit = 10000000;
    const availableAmount = 10000000;
    const outstandingAmount = 0;

    renderLimitBottomSection(
      sanctionedLimit,
      availableAmount,
      outstandingAmount,
    );

    $(this).html('View details <i data-lucide="eye"></i>');
  }

  lucide.createIcons();
});

function renderLimitBottomSection(
  sanctionedLimit,
  availableAmount,
  outstandingAmount,
  status = "account-frozen",
) {
  const overdueAmount = 200000;

  let html = "";

  // CASE 1: Only Limit Validity
  if (status === "validity-only") {
    html = `
      <div class="limit-validity-section">
        <div>
          <h6 class="fw-bold mb-1 validity">Limit validity</h6>

          <p class="mb-0 text-gray-6f validity-text">
            Your sanction validity will expire on
            <strong>01 Jan '26</strong>
          </p>
        </div>

        <button class="expiry-btn button-part">
          Request for renewal/enhancement
        </button>
      </div>
    `;
  }

  // CASE 2: Disabled Renewal + Overdue (No Pay Now)
  else if (status === "overdue-no-pay") {
    html = `
      <div class="limit-validity-section">
        <div>
          <h6 class="fw-bold mb-1 validity">Limit validity</h6>

          <p class="mb-0 text-gray-6f validity-text">
            Your sanction validity will expire on
            <strong>01 Jan '26</strong>
          </p>
        </div>

        <button
          class="expiry-btn button-part"
          disabled
        >
          Request for renewal/enhancement
        </button>
      </div>

      <div class="overdue-section">
        <div>
          <h6 class="fw-bold mb-1 validity">
          Overdue amount
          <i
              data-lucide="info"
              class="icon-css"
              class="info-icon"
              data-tooltip="Balance overdue past payment date. Pay promptly to avoid penalties and keep your limit active"
            ></i></h6>

          <p class="mb-0 text-gray-6f validity-text">
            Pay your overdue amount of
            <span class="overdue-amount">
              ₹${overdueAmount.toLocaleString("en-IN")}<span class="decimal-amount">.00</span>
            </span>
          </p>
        </div>
      </div>
    `;
  }

  // CASE 3: Account Frozen
  else if (status === "account-frozen") {
    $(".account-frozen .loan-value").text("Freeze");
    html = `
      <div class="limit-validity-section">
        <div>
          <h6 class="fw-bold mb-1 validity">Limit validity</h6>

          <p class="mb-0 text-gray-6f validity-text">
            Your sanction validity will expire on
            <strong>01 Jan '26</strong>
          </p>
        </div>

        <button
          class="expiry-btn button-part"
          disabled
        >
          Request for renewal/enhancement
        </button>
      </div>

      <div class="overdue-section">
        <div>
          <h6 class="fw-bold mb-1 validity">
            Account Frozen
            <i
              data-lucide="info"
              class="info-icon icon-css"
              data-tooltip="Balance overdue past payment date. Pay promptly to avoid penalties and keep your limit active"
            ></i>
          </h6>

          <p class="mb-0 text-gray-6f validity-text">
            Pay your overdue amount of
            <span class="overdue-amount-span">
              ₹${overdueAmount.toLocaleString("en-IN")}<span class="decimal-amount">.00</span>
            </span>
            to unfreeze your account
          </p>
        </div>
      </div>
    `;

    // <button class="red-btn button-part"> Pay now </button>

    if (typeof lucide !== "undefined") {
      setTimeout(() => lucide.createIcons(), 0);
    }
  }

  // CASE 4: normal
  else if (status === "normal") {
    html = `
      <div class="limit-validity-section">
        <div>
          <h6 class="fw-bold mb-1 validity">Limit validity</h6>

          <p class="mb-0 text-gray-6f validity-text">
            Your sanction validity will expire on
            <strong>01 Jan '26</strong>
          </p>
        </div>
      </div>
    `;
  }

  $("#limitBottomSection").html(html);
  toggleMobileAccountActions(status);
}

function toggleProcessingFeeBox() {
  const title = $("#cardFooterTitle").text().trim();

  if (
    title === "KYC pending" ||
    title === "eSign pending" ||
    title === "New loan offer"
  ) {
    $("#processingFeeBox")
      .prependTo($("#dashboard-card-top .loan-grid"))
      .show();
  } else {
    $("#processingFeeBox").hide();
  }
}

$(document).ready(function () {
  $("#processingFeeBox").hide();
  toggleProcessingFeeBox();
});

$(document).ready(function () {
  if (isApplicationRejected) {
    $("#rejectModal").show();
  } else if (isApplicationUnderReview) {
    showUnderReviewApplication();
  } else {
    $("#cardHeaderSection").hide();
    $("#cardHeaderSection").each(function () {
      $(this).removeClass("d-flex").addClass("").addClass("d-none");
    });

    $("#step3 .step-label").text("Sanction");

    $("#processingFeeValue").html(`
      ₹10,000<span class="fee-small">.00</span>
      <span class="loan-rupee">
        + GST
      </span>
    `);

    $("#processingFeeBox").show();
    $("#processingFeeBox").each(function () {
      $(this).removeClass("hidden").addClass("visible");
    });
  }
});

$(document).on("click", "#closeRejectModal", function () {
  $("#rejectModal").fadeOut(200);

  showRejectedApplication();
});

$(document).on("click", "#rejectModalCloseBtn", function () {
  $("#rejectModal").fadeOut(200);

  showRejectedApplication();
});

$(document).on("click", "#openAnchorDetails", function () {
  $("#anchorDetailsModal").show();
});

$(document).on("click", "#openProfileView", function () {
  $("#profileViewModal").show();
});

$(document).on("click", "#openProfileEdit", function () {
  $("#profileViewModal").hide();
  $("#profileEditModal").show();
});

$(document).on("click", "[data-close-modal]", function () {
  $(".custom-modal-overlay").addClass("d-none").hide();
});

function showRejectedApplication() {
  $("#cardHeaderSection").show();
  $("#step3 .step-label").text("Application rejected");

  $("#cardFooterSection").each(function () {
    $(this)
      .removeClass("d-flex")
      .removeClass("modal-visible")
      .addClass("d-none");
  });

  $("#loanOfferBadge").hide();

  $("#processingFeeBox").show();

  $("#processingFeeValue").html(`
  ₹10,000<span class="fee-small">.00</span>
  <span class="loan-rupee">
        + GST
      </span>
`);

  $("#dashboard-card-top").addClass("dashboard-card-rejected");

  $(".step-item").removeClass("active current rejected");

  $(".step-circle").each(function (index) {
    $(this).text(index + 1);
  });

  // Step 1 & 2 completed
  $("#step1,#step2").addClass("active");

  $("#step1 .step-circle, #step2 .step-circle").html(
    '<i class="check-icon material-symbols-outlined">check</i>',
  );

  // Step 3 rejected/current
  $("#step3").addClass("rejected");

  $("#step3 .step-circle").html(
    '<i data-lucide="alert-circle" class="check-icon"></i>',
  );

  $(".stepper-progress").addClass("progress-40-success");

  $(".stepper-line").addClass("inactive-line");

  if ($("#stepperRejectedProgress").length === 0) {
    $(".stepper-wrapper").append(`
      <div id="stepperRejectedProgress"></div>
    `);
  }

  const isMobile = $(window).width() < 768;

  $("#stepperRejectedProgress")
    .removeClass("rejected-progress-mobile rejected-progress-desktop")
    .addClass(
      isMobile ? "rejected-progress-mobile" : "rejected-progress-desktop",
    );

  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
}

function showUnderReviewApplication() {
  $("#cardHeaderSection").show();

  $("#step3 .step-label").text("Application under review");

  $("#cardFooterSection").removeClass("d-flex").hide();
  $("#cardHeaderSection").addClass("alert-header");
  $(".alert-icon-outer").addClass("alert-icon-outer-warning");
  $(".alert-icon-middle").addClass("alert-icon-middle-warning");
  $(".alert-icon-custom").addClass("alert-icon-custom-warning");

  $(".alert-icon-outer").removeClass("rejected-outer");
  $(".alert-icon-middle").removeClass("rejected-middle");
  $(".alert-icon-custom").removeClass("rejected-custom");

  $("#rejectedTitle").text("loan application under review");

  $("#loanOfferBadge").hide();

  $("#processingFeeBox").show();

  $("#processingFeeValue").html(`
    ₹10,000<span class="fee-small">.00</span>
    <span class="loan-rupee">
      + GST
    </span>
  `);

  $("#dashboard-card-top")
    .removeClass("dashboard-card-rejected")
    .addClass("dashboard-card-review");

  $(".step-item").removeClass("active current rejected review");

  $(".step-circle").each(function (index) {
    $(this).text(index + 1);
  });

  // Step 1 & 2 completed
  $("#step1,#step2").addClass("active");

  $("#step1 .step-circle, #step2 .step-circle").html(
    '<i class="check-icon material-symbols-outlined">check</i>',
  );

  // Step 3 under review
  $("#step3").addClass("review");

  $("#step3 .step-circle").html(
    '<i data-lucide="clock-3" class="check-icon"></i>',
  );

  $(".stepper-progress").addClass("progress-40-success");

  $(".stepper-line").addClass("inactive-line");

  $("#stepperRejectedProgress").remove();

  if ($("#stepperReviewProgress").length === 0) {
    $(".stepper-wrapper").append(`
      <div id="stepperReviewProgress"></div>
    `);
  }

  const isMobile = $(window).width() < 768;

  $("#stepperRejectedProgress")
    .removeClass("rejected-progress-mobile rejected-progress-desktop")
    .addClass(
      isMobile ? "rejected-progress-mobile" : "rejected-progress-desktop",
    );

  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
}

$(document).on("click", "#mobileEditProfileBtn", function () {
  $("#profileEditModal").show();
});

function toggleMobileAccountActions(status = "") {
  if ($(window).width() >= 768) return;

  const limitSetupVisible = $("#limitSetupSection").is(":visible");

  if (!limitSetupVisible) {
    $("#mobileAccountActions").hide();
    return;
  }

  $("#mobileAccountActions").show();

  $("#viewBalanceBtn").show();

  if (status === "overdue-no-pay" || status === "account-frozen") {
    $("#accountStatementBtn").show();
  } else {
    $("#accountStatementBtn").hide();
  }
}

$(document).on("click", ".mobile-nav-item", function () {
  $(".mobile-nav-item").removeClass("active");

  $(this).addClass("active");

  const tab = $(this).data("tab");

  if (tab === "dashboard") {
    $("#mobileProfileSection").hide();
    $("#dashboard-title").show();
    $("#dashboard-top-section").show();
    $("#dashboardTop").show();
    $("#stepper-card").show();
    $("#dashboardCard").show();
    $(".dashboardCardHigh").show();
  }

  if (tab === "profile") {
    $("#dashboard-top-section").hide();
    $("#mobileProfileSection").show();
    $("#dashboard-title").hide();

    $("#stepper-card").hide();
    $("#dashboardCard").hide();
    $("#dashboardEsign").hide();
    $("#dashboardDocuments").hide();
    $(".dashboardCardHigh").hide();
  }

  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
});

$(document).on("click", "#updateProfileBtn", function () {
  const name = $("#editName").val();
  const dob = $("#editDob").val();
  const email = $("#editEmail").val();
  const mobile = $("#editMobile").val();
  const address = $("#editAddress").val();

  $("#profileName").text(name);
  $("#profileDob").text(dob);
  $("#profileEmail").text(email);
  $("#profileMobile").text(mobile);
  $("#profileAddress").text(address);

  $("#mobileProfileName").text(name);
  $("#mobileProfileDob").text(dob);
  $("#mobileProfileEmail").text(email);
  $("#mobileProfileMobile").text(mobile);
  $("#mobileProfileAddress").text(address + " Mumbai, Maharshtra");

  $("#profileEditModal").fadeOut(200);
});

/* ==================== STEP 3: BANK STATEMENT, ITR & ACCOUNT SELECTION (END) ==================== */

/* ==================== STEP 4: SANCTION OFFER, E-SIGN & OTP VERIFICATION (START) ====================
   Functions in Step 4:
   - startSanctionJourney(): Renders sanction offer UI (interest rate, limit, validity)
   - renderLimitBottomSection(): Bottom sanction limit summary card builder
   - toggleProcessingFeeBox(): Processing fee drawer/card toggler
   - showRejectedApplication(), showUnderReviewApplication(): Rejected/Under-review screen handlers
   - checkTermsScrollComplete(), attachScrollListener(), handleScroll(): Terms & conditions scroll reader
   - checkStep4Completion(): Main validator for Step 4 (Terms agreement + E-Sign trigger)
   - completeEsignFlow(): E-Sign completion & status update
   - initializeOtpSystem(), setupOtpFlow(), resetOtpBox(), validateOtp(): OTP input management
   - startOtpTimer(), updateTimerDisplay(), handleResendOtp(): Resend OTP timer logic
   - handleOtpSuccess(), handleOtpError(), showOtpError(): OTP verification handlers
   ================================================================================== */

function startSanctionJourney() {
  currentStage = 2;

  updateStepper(2);

  $("#step2 .step-label").text("Applied");
  $("#step3 .step-label").text("Sanction approved");

  $("#rateOfInterestBox").show();

  $("#interestRangeBox").hide();

  $(".gap-add").addClass("gap-wide");

  $("#sanctionDateBox").show();
  $("#sanctionDateBox .loan-label").text("Saction date");

  $("#limitExpiryBox").show();
  $("#limitExpiryBox .loan-label").text("Saction validity date");

  $("#loanOfferBadge").addClass("badge-kyc-pending");

  $("#loanOfferBadge").text("KYC pending");

  $("#cardFooterTitle").text("KYC pending");

  $("#processingFeeValue").html(`
      ₹10,000<span class="fee-small">.00</span>
      <span class="loan-rupee">
        + GST
      </span>
  `);

  toggleProcessingFeeBox();

  $("#loan-word").text("Sanctioned limit");
  $(".text-end-part").removeClass("text-end-part").addClass("text-start-part");

  $("#cardFooterText").text(
    "Your ICICI Bank relationship manager will contact you shortly for KYC verification",
  );

  $("#cardFooterBadge").hide();

  $("#applyBtn").hide();

  setTimeout(function () {
    currentStage = 3;

    updateStepper(3);

    $("#cardFooterTitle").html(`
      eSign pending
      <i
        data-lucide="info"
        class="info-icon icon-css"
        data-tooltip="CAL and other loan docs pending for esign"
      ></i>
    `);

    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }

    $("#loanOfferBadge").text("eSign pending");

    toggleProcessingFeeBox();

    if (isContractGenerationInProgress) {
      $("#cardFooterText").text(
        "Your contract generation for the document e-signing is currently in progress.",
      );

      $("#applyBtn")
        .text("Proceed to eSign")
        .prop("disabled", true)
        .addClass("btn-disabled")
        .show();
    } else {
      $("#cardFooterText").html(
        "Signatory: <strong>Gayatri Lakshmi Ronda</strong>",
      );

      $("#applyBtn")
        .text("Proceed to eSign")
        .prop("disabled", false)
        .removeClass("btn-disabled")
        .show();
    }

    $("#dashboardDocuments").show();

    $("#currentAccount").show();
  }, 5000);
}

$(document).on("click", "#applyBtn", function () {
  if (currentStage !== 1) return;

  $("#applySanctionModal").show();
});

$(document).on("click", "#acceptTermsBtn", function () {
  $("#termsModal").hide();

  if (isSystemFailure) {
    $("#systemFailureModal").show();
  } else if (showGstTradename) {
    $("#gstTradename").show();
  } else {
    $("#step1Modal").show();
  }
});

$(document).on("click", "#systemFailedCloseBtn", function () {
  $("#systemFailureModal").hide();
});

$(document).on("change", "#gstTradename input[name='entityName']", function () {
  const isChecked = $(this).is(":checked");
  const proceedBtn = $("#gstTradeProceed");

  if (isChecked) {
    proceedBtn
      .prop("disabled", false)
      .removeClass("btn-disabled")
      .addClass("btn-enabled");
  } else {
    proceedBtn
      .prop("disabled", true)
      .removeClass("btn-enabled")
      .addClass("btn-disabled");
  }
});

$(document).on("click", "#gstTradeProceed", function () {
  const $btn = $(this);
  const $loader = $("#gstTradeLoader");

  $btn.find(".btn-load").hide();
  $loader.show();

  setTimeout(function () {
    $("#gstTradename").hide();

    $("#gstSuccessTradename").show();

    setTimeout(function () {
      $("#gstSuccessTradename").hide();
      $("#step1Modal").show();

      $loader.hide();
      $btn.find(".btn-load").show();
      $btn.prop("disabled", false);
    }, 5000);
  }, 5000);
});

$(document).on("click", "#gstTradeBack", function () {
  $("#gstTradename").hide();
  $("#termsModal").show();
});

$(document).off("click", ".saveExitBtn");

$(document).on("click", ".saveExitBtn", function (e) {
  e.preventDefault();
  e.stopPropagation();

  setTimeout(function () {
    if (typeof lucide !== "undefined" && lucide.createIcons) {
      lucide.createIcons();
    }
  }, 200);

  console.log("Save & Exit clicked!");

  if ($("#step1Modal").is(":visible")) {
    currentStepModalId = "step1Modal";
  } else if ($("#step2Modal").is(":visible")) {
    currentStepModalId = "step2Modal";
  } else if ($("#step3Modal").is(":visible")) {
    currentStepModalId = "step3Modal";
  } else if ($("#step4Modal").is(":visible")) {
    currentStepModalId = "step4Modal";
  } else if ($("#reviewModal").is(":visible")) {
    currentStepModalId = "reviewModal";
  } else {
    console.log("No modal found");
    currentStepModalId = null;
    return;
  }

  console.log("Current modal:", currentStepModalId);

  $("#" + currentStepModalId)
    .hide()
    .hide();
  $("#saveProgressModal").show();

  updateSaveProgressModal(currentStepModalId);
});

function updateSaveProgressModal(stepId) {
  const stepMapping = {
    step1Modal: 1,
    step2Modal: 2,
    step3Modal: 3,
    step4Modal: 4,
    reviewModal: 4,
  };

  const currentStep = stepMapping[stepId] || 1;

  if (typeof lucide !== "undefined" && lucide.createIcons) {
    setTimeout(function () {
      lucide.createIcons();
    }, 100);
  }
}

$(document).on("click", "#backBtn", function () {
  $("#saveProgressModal").hide();

  if (currentStepModalId) {
    $("#" + currentStepModalId).show();
  }

  currentStepModalId = null;
});

$(document).on("click", "#saveBtn", function () {
  $("#saveProgressModal").hide();

  currentStepModalId = null;

  console.log("Progress saved successfully");
});

$(document).on("click", "#saveProgressModal .modal-close-btn", function () {
  $("#saveProgressModal").hide();

  if (currentStepModalId) {
    $("#" + currentStepModalId).show();
  }

  currentStepModalId = null;
});

$(document).on("click", "#saveProgressModal", function (e) {
  if ($(e.target).hasClass("custom-modal-overlay")) {
    $("#saveProgressModal").hide();
    if (currentStepModalId) {
      $("#" + currentStepModalId).show();
    }
    currentStepModalId = null;
  }
});

$(document).on("click", "#reviewModal .saveExitBtn", function (e) {
  e.preventDefault();

  if ($("#reviewModal").is(":visible")) {
    currentStepModalId = "reviewModal";
  }

  $("#" + currentStepModalId)
    .hide()
    .hide();
  $("#saveProgressModal").show();

  updateSaveProgressModal(currentStepModalId);
});

function checkReviewCompletion() {
  const termsChecked = $("#reviewModal #agreeTerms").is(":checked");

  if (termsChecked) {
    enableSaveExitButton();
  } else {
    disableSaveExitButton();
  }
}

function enableSaveExitButton() {
  // console.log("Enabling Save & Exit button");
  $(".saveExitBtn")
    .removeClass("disabled-link")
    .addClass("active")
    .prop("disabled", false);
}

function disableSaveExitButton() {
  console.log("Disabling Save & Exit button");
  $(".saveExitBtn")
    .addClass("disabled-link")
    .removeClass("active")
    .prop("disabled", true);
}

$(document).on("change", "#reviewModal #agreeTerms", function () {
  checkReviewCompletion();
});

$(document).on("click", "#congratulationsModal .saveExitBtn", function (e) {
  if ($(this).length) {
    e.preventDefault();
    currentStepModalId = "congratulationsModal";
    $("#congratulationsModal").hide();
    $("#saveProgressModal").show();
    updateSaveProgressModal("step4Modal");
  }
});

$(document).on("click", "#nextStepsModal .saveExitBtn", function (e) {
  if ($(this).length) {
    e.preventDefault();
    currentStepModalId = "nextStepsModal";
    $("#nextStepsModal").hide();
    $("#saveProgressModal").show();
    updateSaveProgressModal("step4Modal");
  }
});

$(document).on("click", "#step3NextBtn", function () {
  $("#step3Modal").hide();

  disableSaveExitButton();

  $("input[name='bankMode']").prop("checked", false);
  $("input[name='itrMode']").prop("checked", false);
  $("#bankConsent").prop("checked", false);
  $("#itrConsent").prop("checked", false);
  $("#consent-1").hide();
  $("#consent-2").hide();

  $(".itr-upload-section").hide();
  $("#uploadSection").hide();

  bankAccounts = [];
  isFormUnsaved = false;
  $("#bankAccountContainer").empty();
  $("#addBankAccount").removeClass("disabled").addClass("enabled");

  setTimeout(() => {
    toggleStep4Buttons(false);
    checkStep4Completion();
  }, 100);

  $("#step4Modal").show();
});

$(document).on("click", "#step4NextBtn", function () {
  $("#step4Modal").hide();
  $(".saveExitBtn").removeClass("active").addClass("disabled-link");

  $("#reviewModal").show();
});

$(document).on("click", "#reviewSubmitBtn", function () {
  $("#reviewModal").hide();

  $("#congratulationsModal").show();
});

$(document).on("click", "#reviewCancel", function () {
  $("#reviewModal").hide();

  $("#step4Modal").show();
});

$(document).on("click", "#continueToNextStepsBtn", function () {
  $("#congratulationsModal").hide();

  $("#nextStepsModal").show();
});

$(document).on("click", "#modalReviewCloseBtn", function () {
  $("#reviewModal").hide();
  $("#offerNotAcceptModal").show();
});

$(document).on("click", "#modalCongoCloseBtn", function () {
  $("#congratulationsModal").hide();
  $("#offerNotAcceptModal").show();
});

$(document).on("click", "#offerNotAcceptModal .modal-close-btn", function () {
  $("#offerNotAcceptModal").hide();
});

$(document).on("click", "#viewOfferBtn", function () {
  $("#offerNotAcceptModal").hide();
});

$(document).on("click", "#modalNextStepCloseBtn", function () {
  $("#nextStepsModal").hide();

  currentStage = 2;
  updateStepper(2);

  $("#step2 .step-label").text("Applied");
  $("#step3 .step-label").text("Sanction approved");

  $("#loanOfferBadge").addClass("badge-kyc-pending");
  $("#loanOfferBadge").text("KYC pending");

  $("#cardFooterTitle").text("KYC pending");
  $("#cardFooterText").text(
    "Your ICICI Bank relationship manager will contact you shortly for KYC verification",
  );
  $("#cardFooterBadge").hide();

  $("#processingFeeValue").html(`
    ₹10,000<span class="fee-small">.00</span>
    <span class="loan-rupee">
      + GST
    </span>
  `);

  toggleProcessingFeeBox();

  $("#applyBtn").hide();

  setTimeout(function () {
    currentStage = 3;
    updateStepper(3);

    $("#cardFooterTitle").html(`
      eSign pending
      <i
        data-lucide="info"
        class="info-icon icon-css"
        data-tooltip="eSign pending"
      ></i>
    `);

    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }

    $("#loanOfferBadge").text("eSign pending");
    toggleProcessingFeeBox();

    if (isContractGenerationInProgress) {
      $("#cardFooterText").text(
        "Your contract generation for the document eSigning is currently in progress.",
      );
      $("#applyBtn")
        .text("Proceed to eSign")
        .prop("disabled", true)
        .addClass("btn-disabled")
        .show();
    } else {
      $("#cardFooterText").html(
        "Signatory: <strong>Gayatri Lakshmi Ronda</strong>",
      );
      $("#applyBtn")
        .text("Proceed to eSign")
        .prop("disabled", false)
        .removeClass("btn-disabled")
        .show();
    }

    $("#dashboardDocuments").show();
    $("#currentAccount").show();
  }, 5000);
});

$(document).on("click", "#closeNextStepsBtn", function () {
  $("#nextStepsModal").fadeOut(200);

  startSanctionJourney();
});

$(document).on("click", ".journey-close", function () {
  $(this).closest(".custom-modal-overlay").hide();
});

$(document).on("click", "#modalStep1CloseBtn", function () {
  $("#step1Modal").addClass("d-none").hide();
});

$(document).on("click", "#modalStep2CloseBtn", function () {
  $("#step2Modal").addClass("d-none").hide();
});

$(document).on("click", "#modalStep3CloseBtn", function () {
  $("#step3Modal").addClass("d-none").hide();
});

$(document).on("click", "#modalStep4CloseBtn", function () {
  $("#step4Modal").addClass("d-none").hide();
});

$(document).on("mouseenter", ".info-icon", function () {
  const text = $(this).data("tooltip");

  $("#globalTooltip").remove();

  const tooltip = $(
    `<div id="globalTooltip" class="custom-tooltip-global">${text}</div>`,
  );
  $("body").append(tooltip);

  const $this = $(this);
  const offset = $this.offset();
  const tooltipHeight = tooltip.outerHeight();
  const tooltipWidth = tooltip.outerWidth();
  const elementWidth = $this.outerWidth();

  const top = offset.top - tooltipHeight - 12;
  const left = offset.left + elementWidth / 2 - tooltipWidth / 2;

  tooltip.attr("data-top", top).attr("data-left", left).addClass("positioned");
});

$(document).on("mouseleave", ".info-icon", function () {
  $("#globalTooltip").remove();
});

$(document).on("click", ".language-selected", function (e) {
  e.stopPropagation();
  $("#languageDropdown").toggleClass("active");
});

$(document).on("click", ".language-option", function () {
  const value = $(this).data("value");
  const html = $(this).html();

  $(".language-selected").html(
    html + '<span class="material-icons dropdown-arrow">expand_more</span>',
  );

  $("#languageSelect").val(value);

  $(".language-option").show();

  $(this).hide();

  $("#languageDropdown").removeClass("active");

  console.log("Selected:", value);
});

$(document).ready(function () {
  $('.language-option[data-value="en"]').hide();
});

$(document).on("click", "#termsModal .close-modal", function () {
  $("#termsModal").hide();
  $("#applySanctionModal").show();
});

$(document).ready(function () {
  $("#acceptTermsBtn").prop("disabled", true);
});

$(document).on("change", "#agreeTerms", function () {
  $("#acceptTermsBtn").prop("disabled", !$(this).is(":checked"));
});

let emailVerified = false;
let gstVerified = false;

$(document).on("click", ".verify-link", function () {
  const container = $(this).closest(".email-id, .email-id-2");

  if (container.hasClass("email-id-2")) {
    container.find("#emailOtpBoxMobile").slideDown(function () {
      $(this).find(".otp-inputs input:first").focus();
    });
    container.find(".otp-email-display").hide();
    $(this).hide();
    emailTimerInterval = startOtpTimer(
      "emailOtpTimerMobile",
      emailTimerInterval,
    );
  } else {
    container.find("#emailOtpBox").slideDown(function () {
      $(this).find(".otp-inputs input:first").focus();
    });
    container.find("#email-id").hide();
    $(this).hide();
    emailTimerInterval = startOtpTimer("emailOtpTimer", emailTimerInterval);
  }
});

$(document).on("click", ".select-right span", function () {
  clearInterval(gstTimerInterval);

  $("#gstOtpBox").slideDown(function () {
    $("#gstOtpBox .otp-inputs input:first").focus();
  });

  clearInterval(gstTimerInterval);

  $("#gstCustomSelect").hide();

  gstTimerInterval = startOtpTimer("gstOtpTimer", gstTimerInterval);
});

$(document).on(
  "click",
  "#verifyEmailOtpBtn, #verifyEmailOtpBtnMobile",
  function () {
    const isMobile = $(this).attr("id") === "verifyEmailOtpBtnMobile";
    const otpBoxId = isMobile ? "#emailOtpBoxMobile" : "#emailOtpBox";
    const otpBox = $(otpBoxId);

    if (!validateOtp(otpBox)) {
      clearInterval(emailTimerInterval);

      otpBox
        .find(".otp-inputs input")
        .addClass("otp-error")
        .removeClass("otp-default");

      otpBox.find(".otp-error-msg").remove();

      otpBox.find(".otp-row").after(`
      <div
        class="otp-error-msg"
      >
        <i
          data-lucide="info"
          class=" icon-css"
        ></i>

        <span
          class="error-msg-incorrect"
        >
          Incorrect OTP. Please try again
        </span>
      </div>
    `);

      otpBox.find(".otp-resend-wrapper").html(`
      <a
        href="#"
        class="resend-link"
      >
        Resend OTP
      </a>
    `);

      $(this).prop("disabled", false);
      lucide.createIcons();
      return;
    }

    emailVerified = true;
    const container = $(this).closest(".email-id, .email-id-2");

    container.find(otpBoxId).slideUp();
    container.find(".verify-link").replaceWith(`
    <span class="verified-status">
      <i data-lucide="circle-check" class="material-icons"></i>
      Email verified
    </span>
  `);
    container.find("p").addClass("inline-grid");

    lucide.createIcons();
    checkStep1Completion();
  },
);

$(document).on("click", "#verifyGstOtpBtn", function () {
  const otpBox = $("#gstOtpBox");

  if (!validateOtp(otpBox)) {
    clearInterval(gstTimerInterval);

    otpBox
      .find(".otp-inputs input")
      .addClass("otp-error")
      .removeClass("otp-default");

    otpBox.find(".otp-error-msg").remove();

    otpBox.find(".otp-row").after(`
      <div class="otp-error-msg">
        <i data-lucide="info"
           class=" icon-css"></i>

        <span class="error-msg-incorrect">
          Incorrect OTP. Please try again
        </span>
      </div>
    `);

    otpBox.find(".otp-resend-wrapper").html(`
      <a href="#" class="gst-resend-link">
        Resend OTP
      </a>
    `);

    lucide.createIcons();
    return;
  }

  gstVerified = true;

  $("#gstOtpBox").slideUp();

  $(".gstinTrigger").addClass("gstin-valid").removeClass("gstin-invalid");

  $(".gst-error-msg").remove();
  $(".gst-verified-status").remove();

  $(".gstin").after(`
      <div class="verified-status gst-verified-status">
          <i data-lucide="circle-check"></i>
          GSTIN verified
      </div>
  `);

  $("#gstCustomSelect").show();

  lucide.createIcons();

  checkStep1Completion();
});

$(document).on("click", ".gst-resend-link", function (e) {
  e.preventDefault();

  const wrapper = $("#gstOtpBox .otp-resend-wrapper");

  $("#gstOtpBox .otp-error-msg").remove();

  $("#gstOtpBox .otp-inputs input")
    .val("")
    .removeClass("otp-error")
    .addClass("otp-default");

  wrapper.html(`
      Resend OTP after
      <span id="gstOtpTimer">03:00</span>
  `);

  wrapper.append(`
      <div class="otp-resent-msg otp-resent-left">
          <i data-lucide="circle-check" class="check-icon-circle"></i>

          OTP re-sent
      </div>
  `);

  lucide.createIcons();

  clearInterval(gstTimerInterval);

  gstTimerInterval = startOtpTimer("gstOtpTimer", gstTimerInterval);

  $("#gstOtpBox .otp-inputs input:first").focus();
});

function gstVerificationError() {
  $(".gst-error-msg").remove();
  $(".gst-verified-status").remove();

  $(".gstinTrigger").removeClass("gstin-valid").addClass("gstin-invalid");

  $(".gstin").after(`
    <div class="gst-error-msg">

      <i data-lucide="info"
         class="></i>

      <span class="urc-p">
        GSTIN verification fai icon-cssled.
        Try again or upload your GSTIN document.
      </span>
    </div>
  `);

  $("#uploadGst").show();

  lucide.createIcons();
}

function checkStep1Completion() {
  const gstToggleChecked = $(
    ".verification-section .toggle-row .switch input",
  ).is(":checked");
  const urcToggleChecked = $(".urc-section .toggle-row .switch input").is(
    ":checked",
  );
  const emailFilled = emailVerified;

  let dateValid = false;

  const dateValueDesktop = $("#dateDesktop .incorporationDate").val();
  const dateValueMobile = $("#dateMobile .incorporationDate").val();

  const dateValue = dateValueDesktop || dateValueMobile;

  const dateInputDesktop = $("#dateDesktop .date-input");
  const dateInputMobile = $("#dateMobile .date-input");

  const isDesktopInError = dateInputDesktop.hasClass("error");
  const isMobileInError = dateInputMobile.hasClass("error");

  const isDateInError = isDesktopInError || isMobileInError;

  if (dateValue && dateValue === validIncorporationDate && !isDateInError) {
    dateValid = true;
  }

  let gstValid = true;
  let gstProcessStarted = true;

  if (gstToggleChecked) {
    const gstSelected = $("#gstSelect").val() !== "";
    const gstUsernameValue = $("#gstUsername").val().trim();
    const gstUsernameValid =
      gstUsernameValue === validGstUsername &&
      !/[^a-zA-Z0-9]/.test(gstUsernameValue);

    const isGstSelectInError = $(".gstinTrigger").hasClass("error");
    const isGstUsernameInError = $("#gstUsername").hasClass("error");
    const hasGstErrorMsg =
      $(".gst-error-msg").length > 0 || $(".gst-username-error").length > 0;

    const gstInError =
      isGstSelectInError || isGstUsernameInError || hasGstErrorMsg;

    const gstUploadComplete = $("#uploadGst").hasClass("uploaded");

    const gstInProgress =
      $("#gstLoader").is(":visible") || $("#gstVerifyMsg").is(":visible");

    const gstVerifiedOrUploaded = gstVerified || gstUploadComplete;
    gstProcessStarted = gstVerifiedOrUploaded || gstInProgress;

    gstValid =
      !gstInError && gstSelected && gstUsernameValid && gstProcessStarted;
  }

  let urcValid = true;
  let urcProcessStarted = true;

  if (urcToggleChecked) {
    const urcValue = $("#urcNumber").val().trim();
    const urcPattern = /^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$/;
    const urcFilled = urcValue === validUrcNumber && urcPattern.test(urcValue);

    const isUrcInError =
      $("#urc-section-input").hasClass("error") ||
      $(".urc-error-msg").length > 0;

    const urcUploadComplete = $("#uploadUrc").hasClass("uploaded");

    const urcInProgress =
      $("#urcLoader").is(":visible") || $("#urcVerifyMsg").is(":visible");

    const urcVerifiedOrUploaded = urcVerified || urcUploadComplete;
    urcProcessStarted = urcVerifiedOrUploaded || urcInProgress;

    urcValid = !isUrcInError && urcFilled && urcProcessStarted;
  }

  const allValid = emailFilled && dateValid && gstValid && urcValid;

  if (allValid) {
    enableSaveExitButton();
    $("#step1NextBtn").prop("disabled", false).removeClass("btn-disabled");

    $(".saveExitBtn").removeClass("disabled-link").addClass("active");
  } else {
    disableSaveExitButton();
    $("#step1NextBtn").prop("disabled", true).addClass("btn-disabled");

    $(".saveExitBtn").addClass("disabled-link").removeClass("active");
  }
}

$(document).on("input change", ".incorporationDate, input", function () {
  checkStep1Completion();
});

$(document).on("click", "#step1BackBtn", function () {
  $("#step1Modal").hide();

  $("#termsModal").show();
});

$(document).on("click", "#gstStepsToggle", function () {
  $("#gstStepsContent").slideToggle(250, function () {
    const isVisible = $(this).is(":visible");

    $("#gstStepsIcon").attr(
      "data-lucide",
      isVisible ? "chevron-up" : "chevron-down",
    );

    lucide.createIcons();
  });
});

$(document).on("input", ".otp-inputs input", function () {
  $(this).removeClass("otp-error").addClass("otp-default");

  const otpBox = $(this).closest(".otp-box");

  otpBox.find(".otp-error-msg").remove();

  const value = $(this).val();

  if (value.length === 1) {
    $(this).next("input").focus();
  }
});
$(document).on("keydown", ".otp-inputs input", function (e) {
  if (e.key === "Backspace" && $(this).val() === "") {
    $(this).prev("input").focus();
  }
});

let emailTimerInterval;
let gstTimerInterval;

function startOtpTimer(timerId, intervalRef) {
  clearInterval(intervalRef);

  let duration = 180;

  const timer = setInterval(function () {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;

    $("#" + timerId).text(
      `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
    );

    if (duration <= 0) {
      clearInterval(timer);

      let otpBox;
      if (timerId === "emailOtpTimer") {
        otpBox = $("#emailOtpBox");
      } else if (timerId === "emailOtpTimerMobile") {
        otpBox = $("#emailOtpBoxMobile");
      } else if (timerId === "gstOtpTimer") {
        otpBox = $("#gstOtpBox");
      } else {
        otpBox = $(`#${timerId}`).closest(".otp-box");
      }

      if (otpBox && otpBox.length) {
        const resendClass =
          timerId === "gstOtpTimer" ? "gst-resend-link" : "resend-link";

        otpBox.find(".otp-resend-wrapper").html(`
  <span class="otp-resend-text">
    Didn't receive OTP?
    <a href="#"
       class="${resendClass}">
      Resend OTP
    </a>
  </span>
`);

        lucide.createIcons();
      }

      return;
    }

    duration--;
  }, 1000);

  return timer;
}

$(document).on("input", "#gstOtpBox .otp-inputs input", function () {
  $(this).removeClass("otp-error").addClass("otp-default");

  $("#gstOtpBox .otp-error-msg").remove();

  if ($(this).val().length === 1) {
    $(this).next("input").focus();
  }
});

$(document).on("click", "#gstOtpBox .otp-close", function () {
  clearInterval(gstTimerInterval);

  $("#gstOtpBox").slideUp();

  $("#gstCustomSelect").show();
  $(".gstinTrigger").show();
  $("#gstVerifyBtn").show();
  $("#gstinpara").show();
});

$(document).on("keydown", "#gstOtpBox .otp-inputs input", function (e) {
  if (e.key === "Backspace" && $(this).val() === "") {
    $(this).prev("input").focus();
  }
});

$(document).on("click", ".resend-link", function (e) {
  e.preventDefault();

  const otpBox = $(this).closest(".otp-box");
  const isEmailOtp = otpBox.attr("id") === "emailOtpBox";

  otpBox.find(".otp-inputs input").val("");

  otpBox
    .find(".otp-inputs input")
    .removeClass("otp-error")
    .addClass("otp-default");

  otpBox.find(".otp-error-msg").remove();

  otpBox.find(".otp-resend-wrapper").html(`
    <span>
      Resend OTP after
      <span id="${isEmailOtp ? "emailOtpTimer" : "gstOtpTimer"}">03:00</span>
    </span>

    <span class="otp-resent-left">
      <i
        data-lucide="circle-check" class="check-icon-circle"
      ></i>
      OTP re-sent
    </span>
  `);

  lucide.createIcons();

  if (isEmailOtp) {
    emailTimerInterval = startOtpTimer("emailOtpTimer", emailTimerInterval);
  } else {
    gstTimerInterval = startOtpTimer("gstOtpTimer", gstTimerInterval);
  }

  otpBox.find(".otp-inputs input:first").focus();
});

function validateOtp(otpBox) {
  let otp = "";

  otpBox.find(".otp-inputs input").each(function () {
    otp += $(this).val();
  });

  return otp === "111111";
}

$(document).on("click", ".otp-email-close", function () {
  const otpBox = $(this).closest("#emailOtpBox");
  if (otpBox.length) {
    clearInterval(emailTimerInterval);
    emailTimerInterval = null;
    otpBox.slideUp();
    $("#email-id").show();
    $(".verify-link").show();
    resetOtpBox(otpBox);
  }
});

$(document).on("click", ".otp-gst-close", function () {
  const otpBox = $(this).closest("#gstOtpBox");
  if (otpBox.length) {
    clearInterval(gstTimerInterval);
    gstTimerInterval = null;
    otpBox.slideUp();
    $("#gstCustomSelect").show();
    $(".gstinTrigger").show();
    $("#gstVerifyBtn").show();
    $("#gstinpara").show();
    resetOtpBox(otpBox);
  }
});

$(document).on("click", ".otp-close", function () {
  $(this).closest("#emailOtpBox, #gstOtpBox").slideUp();

  $("#email-id").show();
  $(".verify-link").show();

  $("#gstCustomSelect").show();

  $("#gstSelect").hide();
  //here changed
  $(".select-right").show();
  $("#gstVerifyBtn").show();

  $("#gstinpara").show();

  const otpBox = $(this).closest("#emailOtpBoxMobile, #emailOtpBox");
  if (otpBox.length) {
    if (otpBox.attr("id") === "emailOtpBoxMobile") {
      clearInterval(emailTimerInterval);
      emailTimerInterval = null;
      otpBox.slideUp();
      const container = otpBox.closest(".email-id-2");
      container.find(".otp-email-display").show();
      container.find(".verify-link").show();
      resetOtpBox(otpBox);
    } else if (otpBox.attr("id") === "emailOtpBox") {
      clearInterval(emailTimerInterval);
      emailTimerInterval = null;
      otpBox.slideUp();
      $("#email-id").show();
      $(".verify-link").show();
      resetOtpBox(otpBox);
    } else {
      // Generic handler for other OTP boxes
      clearInterval(emailTimerInterval);
      emailTimerInterval = null;
      otpBox.slideUp();
      resetOtpBox(otpBox);
    }
  }
});

$(document).on("mousedown", "#gstVerifyBtn", function (e) {
  e.preventDefault();
  e.stopImmediatePropagation();

  $("#gstOtpBox").slideDown(function () {
    $("#gstOtpBox .otp-inputs input:first").focus();
  });

  $("#gstCustomSelect").hide();
  $("#gstSelect").hide();
  $(".select-right").show();
  $("#gstVerifyBtn").hide();

  $("#gstinpara").hide();

  gstTimerInterval = startOtpTimer("gstOtpTimer", gstTimerInterval);

  return false;
});

$(document).on("change", "#gstSelect", function () {
  const selectedValue = $(this).val();

  const wrapper = $("#gstCustomSelect");
  const trigger = wrapper.find(".gstinTrigger");
  const selectedSpan = trigger.find(".selected-option");
  const options = wrapper.find(".option-item");

  options.each(function () {
    if ($(this).data("value") === selectedValue) {
      selectedSpan.text($(this).text().trim());
      selectedSpan.removeClass("placeholder");
      $(this).addClass("selected");
    } else {
      $(this).removeClass("selected");
    }
  });

  if (!selectedValue) {
    selectedSpan.text("Select");
    selectedSpan.addClass("placeholder");
  }

  $("#gstinpara").show();
  $(".gst-verified-status").remove();
  gstVerified = false;

  trigger.removeClass("verified");
  $("#gstSelect").addClass("default");

  if (selectedValue !== "") {
    $("#gstVerifyBtn").show().prop("disabled", false).addClass("active");
  } else {
    $("#gstVerifyBtn").show();
    $("#gstOtpBox").hide();
    $("#gstCustomSelect").show();
  }

  checkStep1Completion();
});

let urcVerified = false;
let urcTimer;

$(document).on("input", "#urcNumber", function () {
  let value = $(this).val();

  let cleanValue = value.replace(/[^a-zA-Z0-9-]/g, "");

  let formatted = "";
  let raw = cleanValue.replace(/-/g, "");

  if (raw.length > 0) {
    if (raw.length <= 5) {
      formatted = raw.toUpperCase();
    } else if (raw.length <= 7) {
      formatted =
        raw.substring(0, 5).toUpperCase() +
        "-" +
        raw.substring(5, 7).toUpperCase();
    } else if (raw.length <= 9) {
      formatted =
        raw.substring(0, 5).toUpperCase() +
        "-" +
        raw.substring(5, 7).toUpperCase() +
        "-" +
        raw.substring(7, 9);
    } else {
      formatted =
        raw.substring(0, 5).toUpperCase() +
        "-" +
        raw.substring(5, 7).toUpperCase() +
        "-" +
        raw.substring(7, 9) +
        "-" +
        raw.substring(9, 16);
    }
  }

  $(this).val(formatted);

  $(".urc-error-msg").remove();
  $(".urc-grid .text-input").addClass("default").removeClass("error");
  $("#urcVerified").hide();
  $("#urcLoader").hide();
  $("#urcVerifyMsg").hide();
  clearTimeout(urcTimer);

  let rawValue = formatted.replace(/-/g, "");

  if (rawValue.length > 0 && rawValue.length < 10) {
    return;
  }

  if (/[^a-zA-Z0-9]/.test(rawValue) && rawValue.length > 0) {
    $(".urc-grid .text-input").removeClass("default").addClass("error");

    $(".urc-grid .text-input").after(`
            <div class="urc-error-msg">
                <i data-lucide="info" class="red-icon"></i>
                <p class="urc-p">Please enter a valid URC (UDYAM-XX-00-0000000)</p>
            </div>
        `);
    lucide.createIcons();
    checkStep1Completion();
    return;
  }

  const urcPattern = /^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$/;

  if (formatted.length === 19 && urcPattern.test(formatted)) {
    $("#urcLoader").show();
    $("#urcVerifyMsg").show();
    $("#urcVerified").hide();

    if (formatted === validUrcNumber) {
      urcTimer = setTimeout(function () {
        $("#urcLoader").hide();
        $("#urcVerifyMsg").hide();
        urcVerified = true;
        $("#urcVerified").show();
        $("#urc-section-input")
          .addClass("success")
          .removeClass("error default");
        $("#uploadUrc").hide();
        lucide.createIcons();
        checkStep1Completion();
      }, 5000);
    } else {
      urcTimer = setTimeout(function () {
        $("#urcLoader").hide();
        $("#urcVerifyMsg").hide();

        $("#urc-section-input")
          .addClass("error")
          .removeClass("success default");

        $("#urc-section-input").after(`
                    <div class="urc-error-msg">
                        <i data-lucide="info" class="red-icon"></i>
                        <p class="urc-p">Please enter a valid URC (UDYAM-XX-00-0000000)</p>
                    </div>
                `);
        $("#uploadUrc").show();
        lucide.createIcons();
        checkStep1Completion();
      }, 5000);
    }
  } else if (formatted.length > 0 && formatted.length === 19) {
    $(".urc-grid .text-input").removeClass("default").addClass("error");

    $(".urc-grid .text-input").after(`
            <div class="urc-error-msg">
                <i data-lucide="info" class="red-icon"></i>
                <p class="urc-p">Please enter a valid URC (UDYAM-XX-00-0000000)</p>
            </div>
        `);
    lucide.createIcons();
  } else {
    $("#urcLoader").hide();
    $("#urcVerifyMsg").hide();
    $("#urcVerified").hide();
  }

  checkStep1Completion();
});

function urcVerificationError() {
  $("#urc-section-input").addClass("error").removeClass("success default");

  $("#urcVerified").hide();

  $(".urc-error-msg").remove();

  $("#urc-section-input").after(`
    <div class="urc-error-msg">
      <i data-lucide="info" class="red-icon"></i>
      <p class="urc-p">
        GSTIN verification failed. Try again or upload your GSTIN document.
      </p>
    </div>
  `);

  $("#uploadUrc").show();

  lucide.createIcons();
  checkStep1Completion();
}

$(document).on("change", ".incorporationDate", function () {
  const dateValue = $(this).val();
  const container = $(this).closest(
    ".date, .date-2, .mobile, .entity-grid-2, .stepScroll",
  );
  const vintageTextElement = container.find(".selected-date-text");
  const dateInput = $(this).closest(".date-input");
  const dateContainer = $(this).closest(".date, .date-2");

  dateContainer.find(".date-error-msg").remove();

  // Reset styles
  dateInput.addClass("default").removeClass("error success");

  if (dateValue) {
    const selectedDate = new Date(dateValue);
    const currentDate = new Date();

    if (dateValue === validIncorporationDate) {
      dateInput.addClass("default").removeClass("error success");

      if (
        selectedDate instanceof Date &&
        !isNaN(selectedDate) &&
        selectedDate <= currentDate
      ) {
        let years = currentDate.getFullYear() - selectedDate.getFullYear();
        const monthDiff = currentDate.getMonth() - selectedDate.getMonth();
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && currentDate.getDate() < selectedDate.getDate())
        ) {
          years--;
        }

        if (years >= 1) {
          vintageTextElement.text(`Business vintage = ${years} years`).show();
        } else {
          vintageTextElement.text(`Business vintage = ${years} years`).show();
        }
      }

      dateContainer.find(".date-error-msg").remove();
    } else if (dateValue !== "") {
      dateInput.addClass("error").removeClass("default success");
      vintageTextElement.hide();

      dateContainer.append(`
                <div class="date-error-msg">
                    <i data-lucide="info" class="red-icon"></i>
                    <p class="urc-p">Incorporation date is not matching with URC number entered, kindly check & fill again.</p>
                </div>
            `);
      lucide.createIcons();
    } else {
      vintageTextElement.hide();
    }
  } else {
    vintageTextElement.hide();
  }

  if (typeof checkStep1Completion === "function") {
    checkStep1Completion();
  }
});

// ── Custom Calendar Picker ────────────────────────────────────────────
(function () {
  var MONTHS = [
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
  var today = new Date();
  today.setHours(0, 0, 0, 0);

  function sameDay(a, b) {
    return (
      a &&
      b &&
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  function pad(n) {
    return n < 10 ? "0" + n : "" + n;
  }

  function formatYMD(d) {
    return (
      d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate())
    );
  }

  function initState() {
    return {
      view: "year",
      viewMonth: today.getMonth(),
      viewYear: today.getFullYear(),
      centerYear: today.getFullYear(),
      selected: null,
    };
  }

  function buildWeekdays() {
    var w = document.createElement("div");
    w.className = "weekdays";
    ["S", "M", "T", "W", "T", "F", "S"].forEach(function (d) {
      var s = document.createElement("span");
      s.textContent = d;
      w.appendChild(s);
    });
    return w;
  }

  function buildDaysGrid(state, pop) {
    var grid = document.createElement("div");
    grid.className = "days";
    var firstDay = new Date(state.viewYear, state.viewMonth, 1).getDay();
    var totalDays = new Date(state.viewYear, state.viewMonth + 1, 0).getDate();
    for (var i = 0; i < firstDay; i++) {
      var e = document.createElement("div");
      e.className = "day empty";
      grid.appendChild(e);
    }
    for (var d = 1; d <= totalDays; d++) {
      (function (day) {
        var cellDate = new Date(state.viewYear, state.viewMonth, day);
        cellDate.setHours(0, 0, 0, 0);
        var cell = document.createElement("div");
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
            var wrap = pop.closest(".custom-datepicker-wrap");
            var inp = wrap.querySelector(".incorporationDate, .dobDate");
            inp.value = formatYMD(cellDate);
            pop.style.display = "none";
            $(inp).trigger("change");
          });
        }
        grid.appendChild(cell);
      })(d);
    }
    return grid;
  }

  function buildMonthsGrid(state, pop) {
    var grid = document.createElement("div");
    grid.className = "months";
    MONTHS.forEach(function (m, idx) {
      var item = document.createElement("div");
      item.className = "month-item";
      item.textContent = m;
      var future =
        (state.viewYear === today.getFullYear() && idx > today.getMonth()) ||
        state.viewYear > today.getFullYear();
      if (future) item.classList.add("disabled");
      if (idx === state.viewMonth && state.selected)
        item.classList.add("selected");
      if (idx === today.getMonth() && state.viewYear === today.getFullYear())
        item.classList.add("current");
      if (!future) {
        item.addEventListener("click", function (e) {
          e.stopPropagation();
          state.viewMonth = idx;
          state.view = "day";
          render(state, pop);
        });
      }
      grid.appendChild(item);
    });
    return grid;
  }

  var MIN_YEAR = 1980;

  function buildYearsGrid(state, pop) {
    var grid = document.createElement("div");
    grid.className = "years";
    var start = MIN_YEAR;
    var end = today.getFullYear();
    for (var y = start; y <= end; y++) {
      (function (yr) {
        var item = document.createElement("div");
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
            render(state, pop);
          });
        }
        grid.appendChild(item);
      })(y);
    }
    return grid;
  }

  function render(state, pop) {
    pop.innerHTML = "";

    var nav = document.createElement("div");
    nav.className = "nav-dropdown";

    var yBtn = document.createElement("div");
    yBtn.className = "dd" + (state.view === "year" ? " active" : "");
    yBtn.innerHTML =
      "<span>" +
      state.viewYear +
      "</span><span class='caret'>" +
      (state.view === "year" ? "&#9650;" : "&#9660;") +
      "</span>";
    yBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      e.preventDefault();
      state.centerYear = state.viewYear;
      state.view = state.view === "year" ? "day" : "year";
      render(state, pop);
    });

    var mBtn = document.createElement("div");
    mBtn.className = "dd" + (state.view === "month" ? " active" : "");
    mBtn.innerHTML =
      "<span>" +
      MONTHS[state.viewMonth] +
      "</span><span class='caret'>" +
      (state.view === "month" ? "&#9650;" : "&#9660;") +
      "</span>";
    mBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      e.preventDefault();
      state.view = state.view === "month" ? "day" : "month";
      render(state, pop);
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
      var scrollTarget =
        pop.querySelector(".year-item.selected") ||
        pop.querySelector(".year-item.current");
      if (scrollTarget) scrollTarget.scrollIntoView({ block: "center" });
    }
  }

  function openPicker(wrap) {
    var pop = wrap.querySelector(".custom-calendar-popup");
    if (!pop._calState) pop._calState = initState();
    var state = pop._calState;
    var inp = wrap.querySelector(".incorporationDate, .dobDate");
    state.valueOnOpen = inp.value;
    state.selectedOnOpen = state.selected;
    if (inp.value) {
      var parts = inp.value.split("-");
      if (parts.length === 3) {
        var d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
        d.setHours(0, 0, 0, 0);
        state.selected = d;
        state.viewYear = d.getFullYear();
        state.viewMonth = d.getMonth();
        state.centerYear = d.getFullYear();
      }
    }
    state.view = "year";
    render(state, pop);
    pop.style.display = "block";
  }

  $(document).on(
    "click",
    ".custom-datepicker-wrap .incorporationDate, .custom-datepicker-wrap .dobDate",
    function (e) {
      e.stopPropagation();
      var wrap = $(this).closest(".custom-datepicker-wrap")[0];
      var pop = wrap.querySelector(".custom-calendar-popup");
      document.querySelectorAll(".custom-calendar-popup").forEach(function (p) {
        if (p !== pop) p.style.display = "none";
      });
      if (pop.style.display === "none" || pop.style.display === "") {
        openPicker(wrap);
      } else {
        pop.style.display = "none";
      }
    },
  );

  $(document).on("click", function (e) {
    if ($(e.target).closest(".custom-datepicker-wrap").length === 0) {
      document.querySelectorAll(".custom-calendar-popup").forEach(function (p) {
        p.style.display = "none";
      });
    }
  });
})();

// ── Range Date Picker (Bank Statement / ITR start & end dates) ────────
(function () {
  var MONTHS = [
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
  var today = new Date();
  today.setHours(0, 0, 0, 0);

  function sameDayRange(a, b) {
    return (
      a &&
      b &&
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  function padRange(n) {
    return n < 10 ? "0" + n : "" + n;
  }

  function formatYMDRange(d) {
    return (
      d.getFullYear() + "-" + padRange(d.getMonth() + 1) + "-" + padRange(d.getDate())
    );
  }

  function parseYMD(v) {
    var parts = (v || "").split("-");
    if (parts.length !== 3) return null;
    var d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  var MIN_YEAR = 1980;
  var MAX_YEAR = today.getFullYear() + 20;

  function initRangeState() {
    return {
      view: "day",
      viewMonth: today.getMonth(),
      viewYear: today.getFullYear(),
      centerYear: today.getFullYear(),
      selected: null,
      pending: null,
    };
  }

  function buildRangeWeekdays() {
    var w = document.createElement("div");
    w.className = "weekdays";
    ["S", "M", "T", "W", "T", "F", "S"].forEach(function (d) {
      var s = document.createElement("span");
      s.textContent = d;
      w.appendChild(s);
    });
    return w;
  }

  function buildRangeDaysGrid(state, pop) {
    var grid = document.createElement("div");
    grid.className = "days";
    var firstDay = new Date(state.viewYear, state.viewMonth, 1).getDay();
    var totalDays = new Date(state.viewYear, state.viewMonth + 1, 0).getDate();
    for (var i = 0; i < firstDay; i++) {
      var e = document.createElement("div");
      e.className = "day empty";
      grid.appendChild(e);
    }
    for (var d = 1; d <= totalDays; d++) {
      (function (day) {
        var cellDate = new Date(state.viewYear, state.viewMonth, day);
        cellDate.setHours(0, 0, 0, 0);
        var cell = document.createElement("div");
        cell.className = "day";
        cell.textContent = day;
        if (cellDate > today) cell.classList.add("disabled");
        if (sameDayRange(cellDate, today)) cell.classList.add("today");
        if (state.pending && sameDayRange(cellDate, state.pending))
          cell.classList.add("selected");
        if (!cell.classList.contains("disabled")) {
          cell.addEventListener("click", function (e) {
            e.stopPropagation();
            state.pending = cellDate;
            renderRange(state, pop);
          });
        }
        grid.appendChild(cell);
      })(d);
    }
    return grid;
  }

  function buildRangeMonthsGrid(state, pop) {
    var grid = document.createElement("div");
    grid.className = "months";
    MONTHS.forEach(function (m, idx) {
      var item = document.createElement("div");
      item.className = "month-item";
      item.textContent = m;
      var future =
        (state.viewYear === today.getFullYear() && idx > today.getMonth()) ||
        state.viewYear > today.getFullYear();
      if (future) item.classList.add("disabled");
      if (idx === state.viewMonth && state.pending)
        item.classList.add("selected");
      if (idx === today.getMonth() && state.viewYear === today.getFullYear())
        item.classList.add("current");
      if (!future) {
        item.addEventListener("click", function (e) {
          e.stopPropagation();
          state.viewMonth = idx;
          state.view = "day";
          renderRange(state, pop);
        });
      }
      grid.appendChild(item);
    });
    return grid;
  }

  function buildRangeYearsGrid(state, pop) {
    var grid = document.createElement("div");
    grid.className = "years";
    var start = MIN_YEAR;
    var end = MAX_YEAR;
    for (var y = start; y <= end; y++) {
      (function (yr) {
        var item = document.createElement("div");
        item.className = "year-item";
        item.textContent = yr;
        if (yr > today.getFullYear()) item.classList.add("faded");
        if (yr === state.viewYear && state.pending)
          item.classList.add("selected");
        if (yr === today.getFullYear()) item.classList.add("current");
        if (yr <= today.getFullYear()) {
          item.addEventListener("click", function (e) {
            e.stopPropagation();
            state.viewYear = yr;
            state.centerYear = yr;
            state.view = "month";
            renderRange(state, pop);
          });
        }
        grid.appendChild(item);
      })(y);
    }
    return grid;
  }

  function renderRange(state, pop) {
    pop.innerHTML = "";

    var header = document.createElement("div");
    header.className = "range-cal-header";

    var prev = document.createElement("span");
    prev.className = "chevron" + (state.view !== "day" ? " disabled" : "");
    prev.innerHTML = "&#8249;";
    if (state.view === "day") {
      prev.addEventListener("click", function (e) {
        e.stopPropagation();
        state.viewMonth -= 1;
        if (state.viewMonth < 0) {
          state.viewMonth = 11;
          state.viewYear -= 1;
        }
        renderRange(state, pop);
      });
    }

    var title = document.createElement("div");
    title.className = "range-cal-title";

    var mBtn = document.createElement("span");
    mBtn.className = "dd" + (state.view === "month" ? " active" : "");
    mBtn.textContent = MONTHS[state.viewMonth];
    mBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      state.view = state.view === "month" ? "day" : "month";
      renderRange(state, pop);
    });

    var yBtn = document.createElement("span");
    yBtn.className = "dd" + (state.view === "year" ? " active" : "");
    yBtn.textContent = state.viewYear;
    yBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      state.centerYear = state.viewYear;
      state.view = state.view === "year" ? "day" : "year";
      renderRange(state, pop);
    });

    title.appendChild(mBtn);
    title.appendChild(yBtn);

    var next = document.createElement("span");
    next.className = "chevron" + (state.view !== "day" ? " disabled" : "");
    next.innerHTML = "&#8250;";
    if (state.view === "day") {
      next.addEventListener("click", function (e) {
        e.stopPropagation();
        state.viewMonth += 1;
        if (state.viewMonth > 11) {
          state.viewMonth = 0;
          state.viewYear += 1;
        }
        renderRange(state, pop);
      });
    }

    header.appendChild(prev);
    header.appendChild(title);
    header.appendChild(next);
    pop.appendChild(header);

    if (state.view === "day") {
      pop.appendChild(buildRangeWeekdays());
      pop.appendChild(buildRangeDaysGrid(state, pop));
    } else if (state.view === "month") {
      pop.appendChild(buildRangeMonthsGrid(state, pop));
    } else {
      pop.appendChild(buildRangeYearsGrid(state, pop));
      var scrollTarget =
        pop.querySelector(".year-item.selected") ||
        pop.querySelector(".year-item.current");
      if (scrollTarget) scrollTarget.scrollIntoView({ block: "center" });
    }

    var footer = document.createElement("div");
    footer.className = "range-cal-footer";

    var clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "cal-action";
    clearBtn.textContent = "Clear";
    clearBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      var wrap = pop.closest(".range-datepicker-wrap");
      var inp = wrap.querySelector(".start-date, .end-date");
      inp.value = "";
      state.selected = null;
      state.pending = null;
      pop.style.display = "none";
      $(inp).trigger("change");
    });

    var actionGroup = document.createElement("div");
    actionGroup.className = "cal-action-group";

    var cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "cal-action";
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      state.pending = state.selected;
      state.view = "day";
      pop.style.display = "none";
    });

    var okBtn = document.createElement("button");
    okBtn.type = "button";
    okBtn.className = "cal-action";
    okBtn.textContent = "OK";
    okBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      var wrap = pop.closest(".range-datepicker-wrap");
      var inp = wrap.querySelector(".start-date, .end-date");
      if (state.pending) {
        inp.value = formatYMDRange(state.pending);
        state.selected = state.pending;
      }
      pop.style.display = "none";
      $(inp).trigger("change");
    });

    actionGroup.appendChild(cancelBtn);
    actionGroup.appendChild(okBtn);
    footer.appendChild(clearBtn);
    footer.appendChild(actionGroup);
    pop.appendChild(footer);
  }

  function positionPopup(wrap, pop) {
    var rect = wrap.getBoundingClientRect();
    var popWidth = 360;
    var left = rect.left;
    if (left + popWidth > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - popWidth - 8);
    }
    var top = rect.bottom + 8;
    if (top + 466 > window.innerHeight - 8) {
      top = Math.max(8, rect.top - 466 - 8);
    }
    pop.style.left = left + "px";
    pop.style.top = top + "px";
  }

  function openRangePicker(wrap) {
    var pop = wrap.querySelector(".range-calendar-popup");
    if (!pop._calState) pop._calState = initRangeState();
    var state = pop._calState;
    var inp = wrap.querySelector(".start-date, .end-date");
    var current = parseYMD(inp.value);
    state.selected = current;
    state.pending = current;
    state.viewYear = (current || today).getFullYear();
    state.viewMonth = (current || today).getMonth();
    state.centerYear = state.viewYear;
    state.view = "day";
    renderRange(state, pop);
    pop.style.display = "block";
    positionPopup(wrap, pop);
  }

  $(document).on(
    "click",
    ".range-datepicker-wrap .start-date, .range-datepicker-wrap .end-date",
    function (e) {
      e.stopPropagation();
      var wrap = $(this).closest(".range-datepicker-wrap")[0];
      var pop = wrap.querySelector(".range-calendar-popup");
      document.querySelectorAll(".range-calendar-popup").forEach(function (p) {
        if (p !== pop) p.style.display = "none";
      });
      if (pop.style.display === "none" || pop.style.display === "") {
        openRangePicker(wrap);
      } else {
        pop.style.display = "none";
      }
    },
  );

  document.addEventListener(
    "scroll",
    function () {
      document.querySelectorAll(".range-calendar-popup").forEach(function (p) {
        if (p.style.display === "block") {
          var wrap = p.closest(".range-datepicker-wrap");
          if (wrap) positionPopup(wrap, p);
        }
      });
    },
    true,
  );

  $(document).on("click", function (e) {
    if ($(e.target).closest(".range-datepicker-wrap").length === 0) {
      document.querySelectorAll(".range-calendar-popup").forEach(function (p) {
        p.style.display = "none";
      });
    }
  });
})();

/* ==================== STEP 2: PROPRIETOR / PARTNER KYC & PERSONAL DETAILS (END) ==================== */

/* ==================== STEP 3: BANK STATEMENT, ITR & ACCOUNT SELECTION (START) ====================
   Functions in Step 3:
   - initStep3Validation(): Initializes Step 3 field validators
   - checkStep3Completion(): Main validator for Step 3 (Bank statements, ITR, Account selection)
   - createBankForm(), createBankCard(): Dynamic bank form & card element builders
   - createEditBankForm(), restoreCardFromEdit(): Bank account editing logic
   - validateBankForm(), validateConfirmAccount(): Bank account & IFSC validators
   - populateCityAndState(), initializeStep3CityDropdown(): Pincode based city/state auto-fill
   - initState(), buildDaysGrid(), buildMonthsGrid(), buildYearsGrid(), render(), openPicker(): Date picker widget
   ================================================================================== */

(function initStep3Validation() {
  function getInput(selector) {
    return document.querySelector("#step3Modal " + selector);
  }

  function showError(inp, errEl) {
    inp.classList.add("is-error");
    if (errEl) errEl.style.display = "flex";
  }

  function showSuccess(inp, errEl) {
    inp.classList.remove("is-error");
    if (errEl) errEl.style.display = "none";
  }

  function clearState(inp, errEl) {
    inp.classList.remove("is-error", "is-success");
    if (errEl) errEl.style.display = "none";
  }

  var validators = {
    firstName: function (v) {
      return /^[a-zA-Z\s]{2,}$/.test(v.trim());
    },
    lastName: function (v) {
      return /^[a-zA-Z\s]{2,}$/.test(v.trim());
    },
    mobile: function (v) {
      return /^\d{10}$/.test(v);
    },
    email: function (v) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
    },
    address: function (v) {
      return /^[a-zA-Z0-9\s,.-]{5,}$/.test(v.trim());
    },
    pincode: function (v) {
      return /^\d{6}$/.test(v);
    },
  };

  var fieldDefs = [
    {
      key: "firstName",
      inpSel: '.proprietor-first-section input[placeholder="Enter first name"]',
      errSel: ".proprietor-first-section .error-step3-handle",
    },
    {
      key: "lastName",
      inpSel:
        '.custom-properties-middle:last-child input[placeholder="Enter last name"]',
      errSel: ".custom-properties-middle:last-child .error-step3-handle",
    },
    {
      key: "mobile",
      inpSel:
        '.properties-mobile-number-section input[placeholder="10 digit mobile number"]',
      errSel:
        ".properties-mobile-number-section + .error-step3-handle, .properties-mobile-number-section ~ .error-step3-handle",
      numericOnly: true,
      isMobile: true,
    },
    {
      key: "email",
      inpSel: '#step3Modal .proprietor-grid input[placeholder="Enter ID"]',
      errSel: null,
    },
    {
      key: "address",
      inpSel: '#step3Modal input[placeholder="Enter address"]',
      errSel: null,
    },
    {
      key: "pincode",
      inpSel: '#step3Modal input[placeholder="Enter pin code"]',
      errSel: null,
      numericOnly: true,
    },
  ];

  function getMobileErrEl() {
    var mobileSection = document.querySelector(
      "#step3Modal .properties-mobile-number-section",
    );
    if (!mobileSection) return null;

    var existing = mobileSection.parentNode.querySelector(
      ".mobile-error-step3",
    );
    if (existing) return existing;

    var el = document.createElement("div");
    el.className = "error-step3-handle mobile-error-step3";
    el.style.display = "none";
    el.innerHTML = `
        <i data-lucide="info" class="red-icon"></i>
        <p class="error-step3">
            Please enter a valid 10-digit mobile number.
        </p>
    `;
    mobileSection.parentNode.insertBefore(el, mobileSection.nextSibling);

    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }

    return el;
  }

  function getErrEl(inp, key) {
    if (key === "mobile") return getMobileErrEl();
    var next = inp.nextElementSibling;
    while (next) {
      if (next.classList && next.classList.contains("error-step3-handle"))
        return next;
      next = next.nextElementSibling;
    }
    var parent = inp.parentElement;
    if (parent) {
      var pNext = parent.nextElementSibling;
      while (pNext) {
        if (pNext.classList && pNext.classList.contains("error-step3-handle"))
          return pNext;
        pNext = pNext.nextElementSibling;
      }
    }
    return null;
  }

  var touched = {};

  function checkStep3Completion() {
    var modal = document.getElementById("step3Modal");
    if (!modal) return;

    var nextBtn = document.getElementById("step3NextBtn");
    if (!nextBtn) return;

    // Check all text fields
    var allTextValid = true;
    fieldDefs.forEach(function (def) {
      var inp =
        modal.querySelector(def.inpSel.replace("#step3Modal ", "")) ||
        document.querySelector(def.inpSel);
      if (!inp) {
        allTextValid = false;
        return;
      }
      // Check if field has value and is valid
      if (!validators[def.key](inp.value)) {
        allTextValid = false;
      }
    });

    // Fix: Properly check gender, community, and category selects
    var genderSelect = modal.querySelector(".proprietor-gender-section select");
    var genderOk =
      genderSelect &&
      genderSelect.value &&
      genderSelect.value !== "Select gender" &&
      genderSelect.value !== "";

    // Fix: Check all required dropdowns (community and category)
    var allSelectsValid = true;
    var selects = modal.querySelectorAll(
      ".proprietor-grid select:not(.proprietor-gender-section select)",
    );
    selects.forEach(function (sel) {
      if (
        !sel.value ||
        sel.value === "" ||
        sel.value === "select-gender" ||
        sel.value === "Select gender"
      ) {
        allSelectsValid = false;
      }
    });

    // Fix: Check DOB
    var dobInput = modal.querySelector(".date-input input.dobDate");
    var dobOk = dobInput && dobInput.value && dobInput.value !== "";

    // All validation must pass
    var allValid = allTextValid && genderOk && allSelectsValid && dobOk;

    // Enable/disable Next button
    nextBtn.disabled = !allValid;
    if (allValid) {
      nextBtn.style.background = "";
      nextBtn.style.color = "";
      nextBtn.style.cursor = "";
      // Enable Save & Exit button as well
      $(".saveExitBtn").removeClass("disabled-link").addClass("active");
    } else {
      nextBtn.style.background = "#D2D2D2";
      nextBtn.style.color = "#6F6F6F";
      nextBtn.style.cursor = "not-allowed";
      // Disable Save & Exit button
      $(".saveExitBtn").addClass("disabled-link").removeClass("active");
    }
  }

  function setupField(def) {
    var modal = document.getElementById("step3Modal");
    if (!modal) return;

    var inp =
      modal.querySelector(def.inpSel.replace("#step3Modal ", "")) ||
      document.querySelector(def.inpSel);
    if (!inp) return;

    var errEl = getErrEl(inp, def.key);

    if (def.numericOnly) {
      inp.addEventListener("keypress", function (e) {
        if (
          !/\d/.test(e.key) &&
          e.key !== "Backspace" &&
          e.key !== "Delete" &&
          e.key !== "ArrowLeft" &&
          e.key !== "ArrowRight" &&
          e.key !== "Tab"
        ) {
          e.preventDefault();
        }
      });
      inp.setAttribute("inputmode", "numeric");
    }

    // REMOVE the input event handler that shows errors immediately
    // Keep only the blur event for validation
    inp.addEventListener("blur", function () {
      touched[def.key] = true;
      var v = this.value;
      if (v === "") {
        clearState(this, errEl);
      } else if (validators[def.key](v)) {
        showSuccess(this, errEl);
      } else {
        showError(this, errEl);
      }
      checkStep3Completion();
    });

    // Keep input event for formatting only, not validation
    inp.addEventListener("input", function () {
      if (def.numericOnly) {
        this.value = this.value.replace(/\D/g, "");

        if (def.isMobile) {
          this.value = this.value.slice(0, 10);
        }
      }

      // Only update the error message text dynamically if already showing
      // Don't show/hide errors on input
      if (def.isMobile && errEl && errEl.style.display === "flex") {
        var len = this.value.length;
        var pEl = errEl.querySelector("p");
        if (pEl) {
          if (len > 0 && len < 10) {
            pEl.textContent = "Please enter a valid 10-digit mobile number.";
          } else {
            pEl.textContent = "Please enter a valid 10-digit mobile number.";
          }
        }
      }

      checkStep3Completion();
    });

    // Add click handler to clear error when user clicks on the field
    inp.addEventListener("focus", function () {
      // Clear error state when focusing
      if (errEl) {
        errEl.style.display = "none";
      }
      this.classList.remove("is-error");
    });
  }

  function setupSelects() {
    var modal = document.getElementById("step3Modal");
    if (!modal) return;

    var selects = modal.querySelectorAll("select");
    selects.forEach(function (sel) {
      sel.addEventListener("change", function () {
        checkStep3Completion();

        // If a value is selected, remove any error styling
        if (
          this.value &&
          this.value !== "" &&
          this.value !== "select-gender" &&
          this.value !== "Select gender"
        ) {
          this.classList.remove("is-error");
          var errEl = getErrEl(this, "select");
          if (errEl) errEl.style.display = "none";
        }
      });
    });

    var dob = modal.querySelector(".date-input input.dobDate");
    if (dob) {
      dob.addEventListener("change", function () {
        checkStep3Completion();
      });
      dob.addEventListener("blur", function () {
        // Validate DOB on blur
        if (this.value && this.value !== "") {
          // Check if DOB is valid (not future date)
          var selectedDate = new Date(this.value);
          var currentDate = new Date();
          if (selectedDate > currentDate) {
            this.classList.add("is-error");
          }
        }
        checkStep3Completion();
      });
    }
  }

  function validateFieldOnBlur(inp, def, errEl) {
    var v = inp.value;
    if (v === "") {
      clearState(inp, errEl);
    } else if (validators[def.key](v)) {
      showSuccess(inp, errEl);
    } else {
      showError(inp, errEl);
    }
  }

  function init() {
    var modal = document.getElementById("step3Modal");
    if (!modal) return;

    var nextBtn = document.getElementById("step3NextBtn");
    if (nextBtn) {
      nextBtn.disabled = true;
      nextBtn.style.background = "#D2D2D2";
      nextBtn.style.color = "#6F6F6F";
      nextBtn.style.cursor = "not-allowed";
    }

    var pincodeInp = modal.querySelector('input[placeholder="Enter pin code"]');
    if (pincodeInp) {
      pincodeInp.classList.remove("is-error");
    }

    fieldDefs.forEach(function (def) {
      setupField(def);
    });

    setupSelects();
  }

  document.addEventListener("DOMContentLoaded", function () {
    init();

    var step2Btn = document.getElementById("step2NextBtn");
    if (step2Btn) {
      step2Btn.addEventListener("click", function () {
        touched = {};
        setTimeout(init, 50);
      });
    }

    if (typeof $ !== "undefined") {
      $(document).on("click", "#step2NextBtn", function () {
        touched = {};
        setTimeout(init, 100);
      });
    }
  });

  if (document.readyState !== "loading") {
    setTimeout(init, 100);
  }
})();

let bankAccounts = [];
let isFormUnsaved = false;

function checkUnsavedForm() {
  const form = $(".bank-account-form");
  if (form.length === 0) {
    isFormUnsaved = false;
    return;
  }

  const hasValue = form
    .find("input")
    .toArray()
    .some((input) => $(input).val().trim() !== "");
  const hasSelect = form
    .find("select")
    .toArray()
    .some((select) => $(select).val() !== "");

  isFormUnsaved = hasValue || hasSelect;

  if (isFormUnsaved) {
    $("#addBankAccount").addClass("disabled").removeClass("enabled");
  } else {
    $("#addBankAccount").removeClass("disabled").addClass("enabled");
  }
}

function getBankName(value) {
  const bankMap = {
    icici: "ICICI Bank",
    hdfc: "HDFC Bank",
    sbi: "State Bank of India",
    axis: "Axis Bank",
    kotak: "Kotak Mahindra Bank",
    yes: "Yes Bank",
    idfc: "IDFC First Bank",
    pnb: "Punjab National Bank",
    canara: "Canara Bank",
    other: "Other",
  };
  return bankMap[value] || value;
}

function getAccountTypeName(value) {
  const typeMap = {
    current: "Current account",
    savings: "Savings account",
    overdraft: "Overdraft account",
    "cash-credit": "Cash credit account",
  };
  return typeMap[value] || value;
}

function isDuplicateAccount(accountNumber, currentForm) {
  const savedCards = $(".Bank-card-contain");
  let isDuplicate = false;

  const cleanNewAccount = accountNumber.replace(/\s/g, "");

  savedCards.each(function () {
    const cardAccount = $(this)
      .find(".saved-bank-card div:nth-child(3) p")
      .text()
      .trim();
    const cardLast4 = cardAccount.replace(/\s/g, "").slice(-4);
    const newLast4 = cleanNewAccount.slice(-4);

    if (cardLast4 === newLast4) {
      isDuplicate = true;
      return false;
    }
  });

  return isDuplicate;
}

function createBankForm(title = "Primary account") {
  return `
    <div class="bank-account-form" data-form-id="${Date.now()}">
      <h4>${title}</h4>

      <div class="bank-grid">
        <div class="form-group">
          <label class="field-label">Name of bank</label>
          <div class="custom-select-wrapper bank-name-select">
            <div class="custom-select-trigger">
              <span class="selected-option">Select bank</span>
              <div class="select-right">
                <i class="material-icons">expand_more</i>
              </div>
            </div>
            <div class="custom-select-options" style="display: none">
              <div class="option-item" data-value="">Select bank</div>
              <div class="option-item" data-value="icici">ICICI Bank</div>
              <div class="option-item" data-value="hdfc">HDFC Bank</div>
              <div class="option-item" data-value="sbi">State Bank of India</div>
              <div class="option-item" data-value="axis">Axis Bank</div>
              <div class="option-item" data-value="kotak">Kotak Mahindra Bank</div>
              <div class="option-item" data-value="yes">Yes Bank</div>
              <div class="option-item" data-value="idfc">IDFC First Bank</div>
              <div class="option-item" data-value="pnb">Punjab National Bank</div>
              <div class="option-item" data-value="canara">Canara Bank</div>
              <div class="option-item" data-value="other">Other</div>
            </div>
          </div>
          <select class="bank-name" style="display: none">
            <option value="">Select bank</option>
            <option value="icici">ICICI Bank</option>
            <option value="hdfc">HDFC Bank</option>
            <option value="sbi">State Bank of India</option>
            <option value="axis">Axis Bank</option>
            <option value="kotak">Kotak Mahindra Bank</option>
            <option value="yes">Yes Bank</option>
            <option value="idfc">IDFC First Bank</option>
            <option value="pnb">Punjab National Bank</option>
            <option value="canara">Canara Bank</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div class="form-group">
          <label class="field-label">Account type</label>
          <div class="custom-select-wrapper account-type-select">
            <div class="custom-select-trigger">
              <span class="selected-option">Select account type</span>
              <div class="select-right">
                <i class="material-icons">expand_more</i>
              </div>
            </div>
            <div class="custom-select-options" style="display: none">
              <div class="option-item" data-value="">Select account type</div>
              <div class="option-item" data-value="current">Current account</div>
              <div class="option-item" data-value="savings">Savings account</div>
              <div class="option-item" data-value="overdraft">Overdraft account</div>
              <div class="option-item" data-value="cash-credit">Cash credit account</div>
            </div>
          </div>
          <select class="account-type" style="display: none">
            <option value="">Select account type</option>
            <option value="current">Current account</option>
            <option value="savings">Savings account</option>
            <option value="overdraft">Overdraft account</option>
            <option value="cash-credit">Cash credit account</option>
          </select>
        </div>
      </div>

      <div class="bank-grid">
        <div class="form-group first-account">
          <label class="field-label">Account number</label>
          <input
            type="text"
            class="account-number"
            placeholder="Enter account number"
          />
        </div>

        <div class="form-group">
          <label class="field-label">Confirm account number</label>
          <input
            type="text"
            class="confirm-account-number"
            placeholder="Confirm account number"
          />
          <p class="account-match-msg" style="display:none">
            <i data-lucide="check-circle"></i>
            Account numbers matched
          </p>
        </div>
      </div>
      
      <div class="bank-grid calender-grid">
        <div class="form-group mobile">
          <label class="field-label">Bank statement start date <i
              data-lucide="info"
              class="info-icon icon-css"
              data-tooltip="Enter start date as shown on your bank statement"
            ></i></label>
          <div class="date-input range-datepicker-wrap"><input type="text" readonly class="start-date" placeholder="mm/dd/yyyy" /><div class="range-calendar-popup" style="display:none"></div></div>
        </div>

        <div class="form-group" id="calender-second">
          <label class="field-label">Bank statement end date <i
              data-lucide="info"
              class="info-icon icon-css"
              data-tooltip="Enter the end date as shown on your bank statement. Must be after the start date"
            ></i></label>
          <div class="date-input range-datepicker-wrap" ><input type="text" readonly class="end-date" placeholder="mm/dd/yyyy" /><div class="range-calendar-popup" style="display:none"></div></div>
        </div>
      </div>

      <div class="bank-grid bank-margin">
        <div class="form-group upload-group">
          <label class="field-label">Bank statement</label>

          <div class="upload-drop-zone itr-upload bank-upload" data-year="2022-23">
            <div class="upload-left-icon">
                <span class="material-symbols-outlined">draft</span>
              </div>

            <div class="upload-content">
              <div class="upload-title">Upload / Drag & Drop file</div>
              <div class="upload-info">
                (Max size: 2MB | Format: PDF, Excel)
              </div>
            </div>

            <div class="upload-right-icon">
              <i data-lucide="upload"></i>
            </div>

            <input
              type="file"
              class="upload-file-input"
              accept=".pdf,.xls,.xlsx"
              hidden
            />
          </div>
        </div>

        <div></div>

        <div class="bank-actions">
          <span class="reset-bank">Reset</span>

          <button class="save-bank-btn">
            Save
          </button>
        </div>
      </div>

    </div>
  `;
}

function createBankCard(data, title = "Primary account") {
  const bankName = getBankName(data.bank);
  const accountType = getAccountTypeName(data.type);

  return `
  <div class="Bank-card-contain" data-account="${data.account.replace(/\s/g, "")}">
    <div class="bank-title">${title}</div>
    <div class="saved-bank-card">
      <div>
        <label>Bank</label>
        <p>${bankName}</p>
      </div>

      <div>
        <label>Account type</label>
        <p>${accountType}</p>
      </div>

      <div>
        <label>Account number</label>
        <p>${data.account}</p>
      </div>

      <div>
        <label>Statement period</label>
        <p>${data.start} - ${data.end}</p>
      </div>

      <div>
        <label>File name</label>
        <p class="last-child">${data.file} <small class="last-child-small">File size: 1.8MB</small></p>
      </div>
    </div>
  </div>`;
}

function toggleStep4Buttons(enable) {
  $("#step4NextBtn").prop("disabled", !enable);

  if (enable) {
    enableSaveExitButton();
    $("#saveExitBtn").removeClass("disabled-link").addClass("active");
  } else {
    disableSaveExitButton();
    $("#saveExitBtn").removeClass("active").addClass("disabled-link");
  }
}

function checkStep4Completion() {
  const bankMode = $("input[name='bankMode']:checked").val();
  const itrMode = $("input[name='itrMode']:checked").val();

  let enabled = false;

  let bankValid = false;
  if (bankMode === "upload") {
    const savedBanks = bankAccounts.length;
    bankValid = savedBanks > 0;
  } else if (bankMode === "aggregator" || bankMode === "netbanking") {
    bankValid = $("#bankConsent").is(":checked");
  } else {
    bankValid = false;
  }

  let itrValid = false;
  if (itrMode === "upload") {
    const uploadedItrFiles = $(
      ".itr-upload-section .itr-upload.uploaded",
    ).length;
    itrValid = uploadedItrFiles === 3;
  } else if (itrMode === "online") {
    itrValid = $("#itrConsent").is(":checked");
  } else {
    itrValid = false;
  }

  enabled = bankValid && itrValid;

  toggleStep4Buttons(enabled);
}

$(document).on("click", ".save-bank-btn", function () {
  const form = $(this).closest(".bank-account-form");
  const title = form.find("h4").text().trim();

  const accountRaw =
    form.find(".account-number").data("original-account") || "";
  const accountNumber = accountRaw;

  if (isDuplicateAccount(accountNumber, form)) {
    const formGroup = form.find(".form-group.first-account");
    const existingError = formGroup.find(".duplicate-error-msg");

    if (existingError.length === 0) {
      formGroup.append(`
        <div class="duplicate-error-msg">
          <i data-lucide="info" class="red-icon"></i>
          <p class="urc-p">
            This account number is already added. Please enter a different account number.
          </p>
        </div>
      `);
      lucide.createIcons();
    }
    return;
  }

  form.find(".form-group.first-account .duplicate-error-msg").remove();

  const bankValue = form.find(".bank-name").val();
  const typeValue = form.find(".account-type").val();

  const data = {
    bank: bankValue,
    type: typeValue,
    account: "xxxx xxxx xxxx",
    start: form.find(".start-date").val(),
    end: form.find(".end-date").val(),
    file: form.find(".upload-title").text(),
  };

  bankAccounts.push(data);

  form.replaceWith(createBankCard(data, title));

  isFormUnsaved = false;
  $("#addBankAccount").removeClass("disabled").addClass("enabled");

  checkStep4Completion();

  lucide.createIcons();
});

$(document).on("input", ".account input", function () {
  let rawValue = $(this).val().replace(/\s/g, "");
  rawValue = rawValue.replace(/\D/g, "").slice(0, 14);

  let formatted = "";
  if (rawValue.length <= 4) {
    formatted = rawValue;
  } else if (rawValue.length <= 8) {
    formatted = rawValue.substring(0, 4) + " " + rawValue.substring(4);
  } else {
    formatted =
      rawValue.substring(0, 4) +
      " " +
      rawValue.substring(4, 8) +
      " " +
      rawValue.substring(8, 14);
  }

  $(this).val(formatted);
  $(this).data("original-account", rawValue);

  $(this).closest(".account").find(".account-error-msg").remove();
  $(this).closest(".account").find(".account-valid-msg").remove();

  $(this).addClass("default").removeClass("error success");

  checkStep2Completion();
});

$(document).on("blur", ".account input", function () {
  const value = $(this).val().trim();
  const length = value.length;

  if (length > 0 && length < 14) {
    $(this).addClass("error").removeClass("default success");

    $(this).closest(".account").find(".account-error-msg").remove();
    $(this).closest(".account").find(".account-valid-msg").remove();

    $(this).closest(".account").append(`
      <div class="account-error-msg">
        <i data-lucide="info" class="red-icon"></i>
        <p class="urc-p">
          Please enter a valid account number.
        </p>
      </div>
    `);
    lucide.createIcons();
  } else if (length === 0) {
    $(this).addClass("default").removeClass("error success");
    $(this).closest(".account").find(".account-error-msg").remove();
    $(this).closest(".account").find(".account-valid-msg").remove();
  }
});

$(document).on("focus", ".account input", function () {
  const value = $(this).val().trim();

  if (value.length < 14) {
    $(this).addClass("default").removeClass("error success");
    $(this).closest(".account").find(".account-error-msg").remove();
    $(this).closest(".account").find(".account-valid-msg").remove();
  }
});

let leiVerified = false;
let leiTimer;

$(document).on("input", "#leiNumber", function () {
  let value = $(this)
    .val()
    .replace(/[^a-zA-Z0-9]/g, "");

  value = value.substring(0, 20);

  $(this).val(value);

  leiVerified = false;

  clearTimeout(leiTimer);

  $("#leiVerified").hide();
  $("#leiNumber").addClass("default").removeClass("error success");
  $("#leiLoader").hide();
  $("#leiVerifyMsg").hide();
  $("#uploadLei").hide();

  $(".lei-error-msg").remove();
  $(".lei-verified-status").remove();

  $(".lei-input-wrapper").removeClass("verified-input error-input");

  if (value.length === 20) {
    $("#leiLoader").show();
    $("#leiVerifyMsg").show();

    leiTimer = setTimeout(function () {
      $("#leiLoader").hide();
      $("#leiVerifyMsg").hide();

      if (value === "529900T8BM4AUR4DB004") {
        $("#leiVerified").show();
        leiVerified = true;

        $(".lei-input-wrapper").addClass("verified-input");
        $("#leiNumber").addClass("success").removeClass("error default");

        $("#uploadLei").hide();

        $(".lei-input-wrapper").after(`
          <div class="verified-status lei-verified-status">
            <i data-lucide="circle-check"></i>
            LEI verified
          </div>
        `);

        lucide.createIcons();
        checkStep2Completion();
        return;
      }

      $(".lei-input-wrapper").addClass("error-input");
      $("#leiNumber").addClass("error").removeClass("default success");

      $(".lei-input-wrapper").after(`
        <div class="lei-error-msg">
          <i data-lucide="info" class="red-icon"></i>
          <p class="urc-p">
            LEI verification failed. Re-enter or upload your LEI document.
          </p>
        </div>
      `);

      $("#uploadLei").show();

      lucide.createIcons();
      leiVerified = false;
      checkStep2Completion();
    }, 30000);
  } else if (value.length > 0 && value.length < 20) {
    $("#leiNumber").addClass("default").removeClass("error success");

    $(".lei-error-msg").remove();

    if (value.length > 0) {
    }
  }

  checkStep2Completion();
});

$(document).on("blur", "#leiNumber", function () {
  const value = $(this).val().trim();
  const length = value.length;

  if (length > 0 && length < 20) {
    $(".lei-input-wrapper").addClass("error-input");
    $("#leiNumber").addClass("error").removeClass("default success");

    $(".lei-error-msg").remove();
    $(".lei-verified-status").remove();

    $(".lei-input-wrapper").after(`
      <div class="lei-error-msg">
        <i data-lucide="info" class="red-icon"></i>
        <p class="urc-p">
          Entered LEI number is invalid, please enter valid LEI number.
        </p>
      </div>
    `);

    $("#uploadLei").show();

    lucide.createIcons();
    leiVerified = false;
    checkStep2Completion();
  }
});

$(document).on("focus", "#leiNumber", function () {
  const value = $(this).val().trim();

  if (value.length < 20) {
    $(this).addClass("default").removeClass("error success");
    $(".lei-input-wrapper").removeClass("error-input verified-input");
    $(".lei-error-msg").remove();
    $(".lei-verified-status").remove();

    if (!leiVerified) {
      $("#uploadLei").hide();
    }
  }
});

$(document).on("change", "#uploadLei .upload-file-input", function () {
  const file = this.files[0];
  if (!file) return;

  const zone = $(this).closest("#uploadLei");
  const leftIcon = zone.find(".upload-left-icon");
  const rightIcon = zone.find(".upload-right-icon");
  const title = zone.find(".upload-title");
  const loader = zone.find(".upload-loader");

  leftIcon.hide();
  loader.show();

  rightIcon.html('<i data-lucide="x"></i>').addClass("right-icon-color").show();
  lucide.createIcons();

  const uploadTimer = setTimeout(() => {
    loader.hide();

    zone.addClass("uploaded");
    leftIcon.show();
    leftIcon
      .html('<span class="material-symbols-outlined">draft</span>')
      .addClass("file-name");
    title.text(file.name).addClass("file-name");

    $(".lei-input-wrapper").addClass("verified-input");
    $("#leiNumber").addClass("success").removeClass("error default");

    $(".lei-error-msg").remove();

    if ($(".lei-verified-status").length === 0) {
      $(".lei-input-wrapper").after(`
        <div class="verified-status lei-verified-status">
          <i data-lucide="circle-check"></i>
          LEI verified
        </div>
      `);
    }

    leiVerified = true;
    lucide.createIcons();
    checkStep2Completion();
    clearTimeout(uploadTimer);
  }, 5000);
});

function simulateLeiError() {
  const leiNumber = $("#leiNumber");
  leiNumber.val("INVALIDLEINUMBER");
  leiNumber.trigger("input");
}

function simulateLeiSuccess() {
  const leiNumber = $("#leiNumber");
  leiNumber.val("529900T8BM4AUR4DB004");
  leiNumber.trigger("input");
}

function resetLeiState() {
  $("#leiNumber").val("");
  $("#leiNumber").addClass("default").removeClass("error success");
  $("#leiVerified").hide();
  $("#leiVerifyMsg").hide();
  $("#leiLoader").hide();
  $("#uploadLei").hide().removeClass("uploaded");
  $(".lei-error-msg").remove();
  $(".lei-verified-status").remove();
  $(".lei-input-wrapper").removeClass("verified-input error-input");
  leiVerified = false;
  clearTimeout(leiTimer);
  checkStep2Completion();
}

/* ==================== STEP 1: ENTITY & PARTNER DETAILS (END) ==================== */

/* ==================== STEP 2: PROPRIETOR / PARTNER KYC & PERSONAL DETAILS (START) ====================
   Functions in Step 2:
   - checkStep2Completion(): Main validator for Step 2 (Personal Info, Address, PAN/Aadhaar)
   - setupField(), setupSelects(): Registers field setup and blur listener handlers
   - validateFieldOnBlur(): Helper function for input blur validation
   ==================================================================================== */

function checkStep2Completion() {
  const bankToggleChecked = $(".cc-account .toggle-row .switch input")
    .first()
    .is(":checked");

  let accountValid = true;
  if (bankToggleChecked) {
    const accountValue = $(".account input").val().trim();
    const accountLength = accountValue.length;

    const isAccountValid = accountLength === 14;
    const hasAccountError = $(".account-error-msg").length > 0;

    accountValid = isAccountValid && !hasAccountError;
  }

  const leiToggleChecked = $(".cc-account .toggle-row .switch input")
    .eq(1)
    .is(":checked");

  let leiValid = true;
  let leiProcessStarted = true;

  if (leiToggleChecked) {
    const leiNumber = $("#leiNumber").val().trim();
    const hasLeiError = $(".lei-error-msg").length > 0;
    const leiVerifiedOrUploaded =
      leiVerified || $("#uploadLei").hasClass("uploaded");
    const leiInProgress =
      $("#leiLoader").is(":visible") || $("#leiVerifyMsg").is(":visible");
    leiProcessStarted = leiVerifiedOrUploaded || leiInProgress;

    const leiNumberValid = leiNumber.length === 20;
    const leiProofType =
      $(".custom-select-wrapper #entityIdTypeCustomSelect .selected-option")
        .text()
        .trim() !== "Select ID type";
    const leiProofNumber = $("#idProofNumber").val().trim().length > 0;

    leiValid =
      !hasLeiError &&
      leiNumberValid &&
      leiProcessStarted &&
      leiProofType &&
      leiProofNumber;
  }

  const foreignHedged = $("#foreignHedged").val().trim();
  const foreignUnhedged = $("#foreignUnhedged").val().trim();
  const totalForeign = $("#totalForeignExposure").val().trim();
  const totalBanking = $("#totalBankingExposure").val().trim();

  const hasExposureError = $(".exposure-error-msg").length > 0;

  const currencyValid =
    foreignHedged !== "" &&
    foreignUnhedged !== "" &&
    totalForeign !== "" &&
    totalBanking !== "" &&
    !hasExposureError &&
    Number(foreignHedged.replace(/,/g, "")) > 1 &&
    Number(foreignUnhedged.replace(/,/g, "")) > 1 &&
    Number(totalForeign.replace(/,/g, "")) > 1 &&
    Number(totalBanking.replace(/,/g, "")) > 1;

  const completed = accountValid && leiValid && currencyValid;

  $("#step2NextBtn").prop("disabled", !completed);

  if (completed) {
    enableSaveExitButton();
    $("#step2NextBtn").addClass("btn-enabled").removeClass("btn-disbled");

    $(".modal-footer p").addClass("enabled").removeClass("disabled");
  } else {
    disableSaveExitButton();
    $("#step2NextBtn").addClass("btn-disabled").removeClass("btn-enabled");

    $(".modal-footer p").addClass("disabled").removeClass("enabled");
  }
}

$(document).on(
  "input change",
  "#step2Modal input, #step2Modal select",
  function () {
    checkStep2Completion();
  },
);

$(document).ready(function () {
  $("#step2NextBtn").prop("disabled", true);

  $(".modal-footer p").addClass("disabled").removeClass("enabled");
});

$(document).on("input", "#idProofNumber", function () {
  $(this).val(
    $(this)
      .val()
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase()
      .slice(0, 20),
  );

  checkStep2Completion();
});

$(document).on("click", "#step1NextBtn", function () {
  $("#step1Modal").hide();
  $("#step2Modal").show();
  $(".saveExitBtn").removeClass("active").addClass("disabled-link");

  disableSaveExitButton();

  $(".modal-footer p").addClass("disabled").removeClass("enabled");
  leiVerified = false;

  checkStep2Completion();
});

$(document).on("change", "input[name='bankMode']", function () {
  const mode = $(this).val();

  $("#bankConsent").prop("checked", false);

  const consentText = $("#consent-1 span");
  if (mode === "aggregator") {
    consentText.text(
      "I hereby authorize ICICI Bank to fetch my account statement through account aggregator",
    );
  } else if (mode === "netbanking") {
    consentText.text(
      "I hereby authorize ICICI Bank to fetch my account statement through netbanking",
    );
  }

  if (mode === "upload") {
    $("#consent-1").hide();
    $("#consentSection").show();
    $("#uploadSection").show();
    toggleStep4Buttons(false);

    const totalBanks =
      $("#bankAccountContainer .bank-account-form").length +
      $("#bankAccountContainer .Bank-card-contain").length;

    if (totalBanks === 0) {
      $("#bankAccountContainer").append(createBankForm());
      lucide.createIcons();
    }
  } else {
    $("#consent-1").show();
    $("#consentSection").show();
    $("#uploadSection").hide();
    checkStep4Completion();
  }

  checkStep4Completion();
});

function formatAccountNumber(value) {
  value = value.replace(/\D/g, "").substring(0, 12);

  let formatted = "";

  if (value.length <= 4) {
    formatted = value;
  } else if (value.length <= 8) {
    formatted = value.substring(0, 4) + " " + value.substring(4);
  } else {
    formatted =
      value.substring(0, 4) +
      " " +
      value.substring(4, 8) +
      " " +
      value.substring(8, 12);
  }

  return formatted;
}

$(document).on("input", ".account-number,.confirm-account-number", function () {
  $(this).val(formatAccountNumber($(this).val()));
});

$(document).on("input", ".account-number", function () {
  let rawValue = $(this).val().replace(/\s/g, "");
  rawValue = rawValue.replace(/\D/g, "").slice(0, 12);

  let formatted = "";
  if (rawValue.length <= 4) {
    formatted = rawValue;
  } else if (rawValue.length <= 8) {
    formatted = rawValue.substring(0, 4) + " " + rawValue.substring(4);
  } else {
    formatted =
      rawValue.substring(0, 4) +
      " " +
      rawValue.substring(4, 8) +
      " " +
      rawValue.substring(8, 12);
  }

  $(this).val(formatted);
  $(this).data("original-account", rawValue);

  const formGroup = $(this).closest(".form-group");
  formGroup.find(".account-error-msg").remove();
  formGroup.find(".account-valid-msg").remove();
  formGroup.find(".duplicate-error-msg").remove();

  $(this).addClass("default").removeClass("error success");

  const confirmInput = $(this)
    .closest(".bank-account-form")
    .find(".confirm-account-number");
  if (confirmInput.val()) {
    validateConfirmAccount(confirmInput);
  }

  validateBankForm($(this).closest(".bank-account-form"));
});

$(document).on("blur", ".account-number", function () {
  const rawValue = $(this).data("original-account") || "";
  if (rawValue.length === 12) {
    $(this).val("xxxx xxxx xxxx");
  }
  const formGroup = $(this).closest(".form-group");

  formGroup.find(".account-error-msg").remove();
  formGroup.find(".account-valid-msg").remove();
  formGroup.find(".duplicate-error-msg").remove();

  if (rawValue.length > 0 && rawValue.length < 12) {
    $(this).addClass("error").removeClass("default success");

    formGroup.append(`
            <div class="account-error-msg">
                <i data-lucide="info" class="red-icon"></i>
                <p class="urc-p">
                    Please enter a valid 12-digit account number
                </p>
            </div>
        `);
    lucide.createIcons();
  } else if (rawValue.length === 12) {
    const isDuplicate = isDuplicateAccount(
      rawValue,
      $(this).closest(".bank-account-form"),
    );
    if (isDuplicate) {
      $(this).addClass("error").removeClass("default success");

      formGroup.append(`
                <div class="duplicate-error-msg">
                    <i data-lucide="info" class="red-icon"></i>
                    <p class="urc-p">
                        This account number is already added. Please enter a different account number.
                    </p>
                </div>
            `);
      lucide.createIcons();
    } else {
      $(this).addClass("default").removeClass("error success");
    }
  } else if (rawValue.length === 0) {
    $(this).addClass("default").removeClass("error success");
  }

  validateBankForm($(this).closest(".bank-account-form"));
});

$(document).on("change", "input[name='itrMode']", function () {
  const mode = $(this).val();

  $("#consent-2").show();

  $("#itrConsent").prop("checked", false);

  if (mode === "online") {
    $(".itr-consent-section").show();
    $(".itr-upload-section").hide();
  } else {
    $(".itr-consent-section").hide();
    $(".itr-upload-section").show();
  }

  checkStep4Completion();
});

$(document).on("input", ".account-number,.confirm-account-number", function () {
  const form = $(this).closest(".bank-account-form");

  const account = form.find(".account-number").data("original-account") || "";

  const confirm = form.find(".confirm-account-number").val().replace(/\D/g, "");

  if (account.length === 12 && confirm.length === 12 && account === confirm) {
    form
      .find(".confirm-account-number")
      .addClass("success")
      .removeClass("default success");

    form.find(".account-match-msg").show();

    lucide.createIcons();
  } else {
    form
      .find(".confirm-account-number")
      .addClass("default")
      .removeClass("error success");

    form.find(".account-match-msg").hide();
  }

  validateBankForm(form);
});

function validateBankForm(form) {
  const bankText = form
    .find(".bank-name-select .selected-option")
    .text()
    .trim();
  const typeText = form
    .find(".account-type-select .selected-option")
    .text()
    .trim();

  const bank = bankText !== "Select bank" && bankText !== "";

  const type = typeText !== "Select account type" && typeText !== "";

  const originalAccount =
    form.find(".account-number").data("original-account") || "";
  const account = originalAccount.length === 12;

  const confirmRaw = form
    .find(".confirm-account-number")
    .val()
    .replace(/\s/g, "")
    .replace(/\D/g, "");
  const confirm = confirmRaw.length === 12 && originalAccount === confirmRaw;

  const start = form.find(".start-date").val();
  const end = form.find(".end-date").val();

  let dateValid = false;
  if (start && end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (startDate.getTime() !== endDate.getTime() && endDate > startDate) {
      dateValid = true;
    }
  }

  const uploaded = form.find(".upload-drop-zone").hasClass("uploaded");

  const complete = bank && type && account && confirm && dateValid && uploaded;

  const saveBtn = form.find(".save-bank-btn");
  saveBtn.prop("disabled", !complete);

  if (complete) {
    saveBtn.addClass("enabled").removeClass("disabled");

    form.find(".reset-bank").addClass("enabled").removeClass("disabled");
  } else {
    saveBtn.addClass("disabled").removeClass("enabled");

    form.find(".reset-bank").addClass("disabled").removeClass("enabled");
  }

  return complete;
}

$(document).on("click", ".reset-bank", function () {
  const form = $(this).closest(".bank-account-form");

  form.find("input").val("");
  form.find("select").prop("selectedIndex", 0);
  form.find(".custom-select-trigger .selected-option").text("Select bank");
  form
    .find(".custom-select-trigger .selected-option")
    .text("Select account type");

  form.find(".account-match-msg").hide();
  form.find(".itr-upload").removeClass("uploaded");
  form.find(".duplicate-error-msg").remove();

  form
    .find(".account-number, .confirm-account-number, .start-date, .end-date")
    .addClass("default")
    .removeClass("error success");
  form.find(".date-error-msg").remove();
  form.find("#calender-second, .mobile").removeClass("date-error");

  isFormUnsaved = false;
  $("#addBankAccount").removeClass("disabled").addClass("enabled");

  validateBankForm(form);
});

$(document).on("click", "#step4BackBtn", function () {
  $("#step4Modal").hide();

  $("#step3Modal").show();
});

$(document).on("change", ".itr-upload-section .upload-file-input", function () {
  const file = this.files[0];

  if (!file) return;

  const zone = $(this).closest(".itr-upload");

  const leftIcon = zone.find(".upload-left-icon");
  const rightIcon = zone.find(".upload-right-icon");
  const title = zone.find(".upload-title");

  toggleStep4Buttons(false);

  const loader = zone.find(".upload-loader");

  leftIcon.hide();
  loader.show();

  rightIcon
    .html(
      `
      <i data-lucide="x"></i>
  `,
    )
    .addClass("right-icon-color");

  lucide.createIcons();

  setTimeout(() => {
    zone.addClass("uploaded");

    loader.hide();
    leftIcon.show();
    leftIcon
      .html('<span class="material-symbols-outlined">draft</span>')
      .addClass("file-name");

    title.text(file.name).addClass("file-name");

    rightIcon.html('<i data-lucide="x"></i>').addClass("right-icon-color");

    lucide.createIcons();

    checkStep4Completion();
  }, 5000);
});

$(document).on("change", ".bank-upload .upload-file-input", function () {
  const file = this.files[0];

  if (!file) return;

  const zone = $(this).closest(".bank-upload");

  zone.addClass("uploaded");

  zone.find(".upload-title").text(file.name).addClass("file-name");

  zone
    .find(".upload-left-icon")
    .html('<span class="material-symbols-outlined">draft</span>')
    .addClass("file-name");

  zone
    .find(".upload-right-icon")
    .html('<i data-lucide="x"></i>')
    .addClass("itr-remove");

  lucide.createIcons();

  validateBankForm(zone.closest(".bank-account-form"));
});

$(document).on(
  "input change",
  ".bank-account-form input, .bank-account-form select",
  function () {
    const form = $(this).closest(".bank-account-form");
    if (form.length > 0) {
      const hasValue = form
        .find("input")
        .toArray()
        .some((input) => $(input).val().trim() !== "");
      const hasSelect = form
        .find("select")
        .toArray()
        .some((select) => $(select).val() !== "");

      isFormUnsaved = hasValue || hasSelect;

      if (isFormUnsaved) {
        $("#addBankAccount").addClass("disabled").removeClass("enabled");
      } else {
        $("#addBankAccount").removeClass("disabled").addClass("enabled");
      }
    }
  },
);

$(document).on("click", ".accordion-header", function () {
  const accordion = $(this).closest(".review-accordion");

  accordion.toggleClass("active");

  const icon = $(this).find("svg");

  const isActive = accordion.hasClass("active");
  icon.attr("data-rotated", isActive ? "true" : "false");
});

$(document).on("change", ".toggle-row .switch input", function () {
  const gstToggle = $(this)
    .closest(".toggle-row")
    .find("h4:contains('Do you have GSTIN?')");
  if (gstToggle.length) {
    const isChecked = $(this).is(":checked");
    const gstGrid = $(this).closest(".verification-section").find(".gst-grid");
    if (isChecked) {
      gstGrid.show();
      $(".gst-steps-card").show();
    } else {
      gstGrid.hide();
      $(".gst-steps-card").hide();
      $(this).closest(".verification-section").find("#gstOtpBox").hide();
      gstVerified = false;

      const trigger = $(".gstinTrigger");
      trigger.addClass("default").removeClass("gstin-valid gstin-invalid");
      $(".gst-verified-status").remove();
      $(".gst-error-msg").remove();
      $("#uploadGst").hide();
      $("#gstVerifyBtn").hide();
    }
    checkStep1Completion();
  }

  const urcToggle = $(this)
    .closest(".toggle-row")
    .find("h4:contains('Do you have URC?')");
  if (urcToggle.length) {
    const isChecked = $(this).is(":checked");
    const urcSection = $(this).closest(".urc-section");
    const urcLabel = urcSection.find("label:contains('URC number')");
    const urcInput = urcSection.find("#urc-section-input");
    if (isChecked) {
      urcLabel.show();
      urcInput.show();
      $(".gst-steps-card").show();
      $(this).closest(".urc-section").find("#urcVerified").hide();
      $(this).closest(".urc-section").find("#urcVerifyMsg").hide();
    } else {
      urcLabel.hide();
      $(".gst-steps-card").show();
      urcInput.hide();
      urcVerified = false;

      $("#urc-section-input").addClass("default").removeClass("success error");
      $(".urc-error-msg").remove();
      $("#uploadUrc").hide();
      $("#urcVerified").hide();
      $("#urcVerifyMsg").hide();
      $("#urcLoader").hide();
    }
    checkStep1Completion();
  }

  const bankToggle = $(this)
    .closest(".toggle-row")
    .find("h4:contains('Are you an ICICI Bank customer?')");

  if (bankToggle.length) {
    const isChecked = $(this).is(":checked");
    const account = $(this).closest(".cc-account").find(".account");

    if (isChecked) {
      account.show().show();
    } else {
      account.hide().addClass("d-none");
    }

    checkStep2Completion();
  }

  const leiToggle = $(this)
    .closest(".toggle-row")
    .find("h4:contains('Do you have LEI?')");

  if (leiToggle.length) {
    const isChecked = $(this).is(":checked");
    const leiSection = $(this)
      .closest(".cc-account")
      .find(".account-grid-first");

    if (isChecked) {
      leiSection.show().show();
    } else {
      leiSection.hide().addClass("d-none");
    }
  }
});

$(document).on("click", ".custom-select-trigger", function (e) {
  e.stopPropagation();

  const wrapper = $(this).closest(".custom-select-wrapper");
  const options = wrapper.find(".custom-select-options");
  const isOpen = options.is(":visible");

  $(".custom-select-options").not(options).hide();
  $(".custom-select-trigger").not(this).removeClass("active");

  if (isOpen) {
    options.hide();
    $(this).removeClass("active");
  } else {
    options.show();
    $(this).addClass("active");
  }
});

$(document).on("click", ".custom-select-options .option-item", function (e) {
  e.stopPropagation();

  var accordion = $(this).closest(".partner-accordion");
  if (accordion.length && !accordion.hasClass("saved")) {
    setTimeout(function () {
      validatePartnerAccordion(accordion);
    }, 50);
  }

  const wrapper = $(this).closest(".custom-select-wrapper");
  const trigger = wrapper.find(".custom-select-trigger");
  const selectedSpan = trigger.find(".selected-option");
  const hiddenSelect = wrapper.siblings("select");
  const options = wrapper.find(".custom-select-options");

  const value = $(this).data("value");
  const text = $(this).text().trim();

  selectedSpan.text(text);
  selectedSpan.removeClass("placeholder");

  if (hiddenSelect.length) {
    hiddenSelect.val(value);
    hiddenSelect.trigger("change");
  }

  options.find(".option-item").removeClass("selected");
  $(this).addClass("selected");

  options.hide();
  trigger.removeClass("active");

  const form = wrapper.closest(".bank-account-form");
  if (form.length) {
    validateBankForm(form);

    const hasValue = form
      .find("input")
      .toArray()
      .some((input) => $(input).val().trim() !== "");
    const hasSelect = form
      .find("select")
      .toArray()
      .some((select) => $(select).val() !== "");
    isFormUnsaved = hasValue || hasSelect;

    if (isFormUnsaved) {
      $("#addBankAccount").addClass("disabled").removeClass("enabled");
    }
  }
});

$(document).on("click", function (e) {
  if (!$(e.target).closest(".custom-select-wrapper").length) {
    $(".custom-select-options").hide();
    $(".custom-select-trigger").removeClass("active");
  }
});

$(document).on("click", "#simulateGstError", function () {
  gstVerificationError();
});

$(document).on("click", "#simulateUrcError", function () {
  urcVerificationError();
});

/* ==================== STEP 1: ENTITY & PARTNER DETAILS (START) ====================
   Functions in Step 1:
   - setGstStatus(success): Toggles GSTIN verification state
   - setUrcStatus(success): Toggles URC verification state
   - simulateGstError(), simulateUrcError(): Error triggers for GST/URC
   - gstVerificationError(), urcVerificationError(): Displays GST/URC error messages
   - testGstUsername(), testIncorporationDate(), testUrcNumber(): Validates GST and URC inputs
   - getPartnerFormHtml(index): Generates dynamic HTML form for new partner accordions
   - validatePartnerAccordion(accordion): Validates partner name, PAN, DOB, shares
   - checkAllPartnersSaved(): Checks if all partner cards are saved
   - checkStep1Completion(): Main validator for Step 1 completion
   - simulateLeiError(), simulateLeiSuccess(), resetLeiState(): Legal Entity Identifier handler
   ================================================================================== */

function setGstStatus(success) {
  isGstSuccess = success;
  $("#verifyGstOtpBtn").click();
}

function setUrcStatus(success) {
  isUrcSuccess = success;
  const urcInput = $("#urcNumber");
  urcInput.val("ABCDEFGHIJKLMNOP");
  urcInput.trigger("input");
}

function simulateGstError() {
  isGstSuccess = false;
  gstVerificationError();
}

function simulateUrcError() {
  isUrcSuccess = false;
  urcVerificationError();
}

$(document).on("input", "#gstUsername", function () {
  const value = $(this).val().trim();
  const errorMsg = $(this).closest("div").find(".gst-username-error");

  $(".gst-username-error").remove();
  $(".username .text-input").addClass("default").removeClass("error success");

  if (value.length === 0) {
    return;
  }

  if (value.length >= 15) {
    if (/[^a-zA-Z0-9]/.test(value) && value.length > 0) {
      $(".username .text-input")
        .addClass("error")
        .removeClass("default success");

      $(".username .text-input").after(`
        <div class="gst-username-error">
          <i data-lucide="info" class="red-icon"></i>
          <p class="urc-p">Please enter a valid username.</p>
        </div>
      `);
      lucide.createIcons();
      checkStep1Completion();
      return;
    }

    if (value.length > 0 && value !== validGstUsername) {
      $(".username .text-input")
        .addClass("error")
        .removeClass("default success");

      $(".username .text-input").after(`
        <div class="gst-username-error">
          <i data-lucide="info" class="red-icon"></i>
          <p class="urc-p">GSTIN does not match with the given username.</p>
        </div>
      `);
      lucide.createIcons();
    } else if (value === validGstUsername) {
      $(".username .text-input")
        .addClass("default")
        .removeClass("error success");
    }
  }

  checkStep1Completion();
});

function testGstUsername(username) {
  $("#gstUsername").val(username).trigger("input");
}

function testIncorporationDate(date) {
  $(".incorporationDate").val(date).trigger("change");
}

function testUrcNumber(urc) {
  $("#urcNumber").val(urc).trigger("input");
}

$(document).on("change", "#uploadGst .upload-file-input", function () {
  const file = this.files[0];
  if (!file) return;

  const zone = $(this).closest("#uploadGst");
  const leftIcon = zone.find(".upload-left-icon");
  const rightIcon = zone.find(".upload-right-icon");
  const title = zone.find(".upload-title");
  const loader = zone.find(".upload-loader");

  leftIcon.hide();
  loader.show();

  rightIcon.html('<i data-lucide="x"></i>').addClass("right-icon-color").show();
  lucide.createIcons();

  $(".gst-username-error").remove();

  const uploadTimer = setTimeout(() => {
    zone.addClass("uploaded");
    loader.hide();
    leftIcon.show();
    leftIcon
      .html('<span class="material-symbols-outlined">draft</span>')
      .addClass("file-name");
    title.text(file.name).addClass("file-name");

    $(".gstinTrigger").addClass("gstin-valid").removeClass("gstin-invalid");

    $(".gst-error-msg").remove();

    if ($(".gst-verified-status").length === 0) {
      $(".gstin").after(`
        <div class="verified-status gst-verified-status">
          <i data-lucide="circle-check"></i>
          GSTIN verified
        </div>
      `);
    }

    $("#gstCustomSelect").show();

    lucide.createIcons();
    checkStep1Completion();
    clearTimeout(uploadTimer);
  }, 5000);
});

$(document).on("change", "#uploadUrc .upload-file-input", function () {
  const file = this.files[0];
  if (!file) return;

  const zone = $(this).closest("#uploadUrc");
  const leftIcon = zone.find(".upload-left-icon");
  const rightIcon = zone.find(".upload-right-icon");
  const title = zone.find(".upload-title");
  const loader = zone.find(".upload-loader");

  leftIcon.hide();
  loader.show();

  rightIcon.html('<i data-lucide="x"></i>').addClass("right-icon-color").show();
  lucide.createIcons();

  const uploadTimer = setTimeout(() => {
    zone.addClass("uploaded");
    loader.hide();
    leftIcon.show();
    leftIcon
      .html('<span class="material-symbols-outlined">draft</span>')
      .addClass("file-name");
    title.text(file.name).addClass("file-name");

    $("#urc-section-input").addClass("success").removeClass("error default");

    $(".urc-error-msg").remove();

    if ($("#urcVerified").is(":hidden")) {
      $("#urcVerified").show();
    }

    lucide.createIcons();
    checkStep1Completion();
    clearTimeout(uploadTimer);
  }, 5000);
});

$(document).on(
  "click",
  "#uploadGst, #uploadUrc, .itr-upload, .bank-upload, #uploadLei",
  function (e) {
    e.stopPropagation();
    $(this).find(".upload-file-input")[0].click();
  },
);

$(document).on(
  "input",
  "#foreignHedged, #foreignUnhedged, #totalForeignExposure, #totalBankingExposure",
  function () {
    const parentContainer = $(this).closest("div").parent();
    parentContainer.find(".exposure-error-msg").remove();
    $(this).addClass("default").removeClass("error success");

    checkStep2Completion();
  },
);

$(document).on(
  "blur",
  "#foreignHedged, #foreignUnhedged, #totalForeignExposure, #totalBankingExposure",
  function () {
    const value = $(this).val().trim();
    const inputId = $(this).attr("id");
    const parentContainer = $(this).closest("div").parent();

    parentContainer.find(".exposure-error-msg").remove();

    const numValue = parseFloat(value.replace(/,/g, ""));

    if (
      value === "" ||
      value === "0" ||
      value === "1" ||
      isNaN(numValue) ||
      numValue <= 1
    ) {
      if (value !== "") {
        $(this).addClass("error").removeClass("default success");

        let labelText = "";
        if (inputId === "foreignHedged") {
          labelText = "Foreign currency exposure hedged";
        } else if (inputId === "foreignUnhedged") {
          labelText = "Foreign currency exposure unhedged";
        } else if (inputId === "totalForeignExposure") {
          labelText = "Total foreign currency exposure";
        } else if (inputId === "totalBankingExposure") {
          labelText = "Total banking exposure";
        }

        $(this).closest(".input-wrapper").after(`
          <div class="exposure-error-msg">
            <i data-lucide="info" class="red-icon"></i>
            <p class="urc-p">
              ${labelText} must be greater than 1.
            </p>
          </div>
        `);

        lucide.createIcons();
      }
    } else if (value !== "" && !isNaN(numValue) && numValue > 1) {
      $(this).addClass("default").removeClass("error success");
    }

    checkStep2Completion();
  },
);

$(document).on(
  "focus",
  "#foreignHedged, #foreignUnhedged, #totalForeignExposure, #totalBankingExposure",
  function () {
    const parentContainer = $(this).closest("div").parent();
    parentContainer.find(".exposure-error-msg").remove();
    $(this).addClass("default").removeClass("error success");
  },
);

$(document).on("input", "#foreignHedged, #foreignUnhedged", function () {
  const hedgedRaw = $("#foreignHedged").val().replace(/,/g, "");
  const unhedgedRaw = $("#foreignUnhedged").val().replace(/,/g, "");

  const hedged = parseFloat(hedgedRaw) || 0;
  const unhedged = parseFloat(unhedgedRaw) || 0;

  const total = hedged + unhedged;

  if (hedged > 0 && unhedged > 0 && total > 0) {
    const totalStr = total.toString();
    let formattedTotal = totalStr;
    if (totalStr.length > 3) {
      let lastThree = totalStr.slice(-3);
      let remaining = totalStr.slice(0, -3);
      let groups = [];
      for (let i = remaining.length; i > 0; i -= 2) {
        groups.unshift(remaining.slice(Math.max(0, i - 2), i));
      }
      formattedTotal = groups.join(",") + "," + lastThree;
    }
    $("#totalForeignExposure").val(formattedTotal);
  } else {
    $("#totalForeignExposure").val("");
  }

  const parentContainer = $("#totalForeignExposure").closest("div").parent();
  parentContainer.find(".exposure-error-msg").remove();
  $("#totalForeignExposure").addClass("default").removeClass("error success");

  checkStep2Completion();
});

$(document).on("change", "#bankConsent, #itrConsent", function () {
  checkStep4Completion();
});

$(document).ready(function () {
  $("#consent-1").hide();
  $("#consent-2").hide();

  toggleStep4Buttons(false);

  $("#bankConsent").prop("checked", false);
  $("#itrConsent").prop("checked", false);
});

function validateConfirmAccount(input) {
  const form = input.closest(".bank-account-form");
  const accountRaw =
    form.find(".account-number").data("original-account") || "";
  const confirmRaw = input.val().replace(/\s/g, "").replace(/\D/g, "");

  input.closest(".form-group").find(".confirm-error-msg").remove();
  input.closest(".form-group").find(".confirm-valid-msg").remove();

  input.addClass("default").removeClass("error success");

  if (confirmRaw.length === 0) {
    return;
  }

  if (
    accountRaw.length === 12 &&
    confirmRaw.length === 12 &&
    accountRaw === confirmRaw
  ) {
    input.addClass("success").removeClass("error default");
    lucide.createIcons();
  } else if (confirmRaw.length > 0 && confirmRaw.length < 12) {
    input.addClass("error").removeClass("default success");

    input.closest(".form-group").append(`
      <div class="confirm-error-msg">
        <i data-lucide="info" class="red-icon"></i>
        <p class="urc-p">
          Account number not matched
        </p>
      </div>
    `);
    lucide.createIcons();
  } else if (confirmRaw.length === 12 && accountRaw !== confirmRaw) {
    input.addClass("error").removeClass("default success");

    input.closest(".form-group").append(`
      <div class="confirm-error-msg">
        <i data-lucide="info" class="red-icon"></i>
        <p class="urc-p">
          Account number not matched
        </p>
      </div>
    `);
    lucide.createIcons();
  }
}

$(document).on("input", ".confirm-account-number", function () {
  let rawValue = $(this)
    .val()
    .replace(/\s/g, "")
    .replace(/\D/g, "")
    .slice(0, 12);

  let formatted = "";
  if (rawValue.length <= 4) {
    formatted = rawValue;
  } else if (rawValue.length <= 8) {
    formatted = rawValue.substring(0, 4) + " " + rawValue.substring(4);
  } else {
    formatted =
      rawValue.substring(0, 4) +
      " " +
      rawValue.substring(4, 8) +
      " " +
      rawValue.substring(8, 12);
  }

  $(this).val(formatted);

  $(this).closest(".form-group").find(".confirm-error-msg").remove();
  $(this).closest(".form-group").find(".confirm-valid-msg").remove();
  $(this).addClass("default").removeClass("error success");

  const form = $(this).closest(".bank-account-form");
  const accountRaw =
    form.find(".account-number").data("original-account") || "";
  const confirmRaw = rawValue;

  if (
    accountRaw.length === 12 &&
    confirmRaw.length === 12 &&
    accountRaw === confirmRaw
  ) {
    $(this).addClass("success").removeClass("error default");
    form.find(".account-match-msg").show();
    lucide.createIcons();
  } else if (confirmRaw.length > 0 && confirmRaw.length < 12) {
    $(this).addClass("default").removeClass("error success");
    form.find(".account-match-msg").hide();
  } else if (confirmRaw.length === 12 && accountRaw !== confirmRaw) {
    $(this).addClass("default").removeClass("error success");
    form.find(".account-match-msg").hide();
  }

  validateBankForm(form);
});

$(document).on("blur", ".confirm-account-number", function () {
  const form = $(this).closest(".bank-account-form");
  const accountRaw =
    form.find(".account-number").data("original-account") || "";
  const confirmRaw = $(this).val().replace(/\s/g, "").replace(/\D/g, "");
  const formGroup = $(this).closest(".form-group");

  formGroup.find(".confirm-error-msg").remove();
  formGroup.find(".confirm-valid-msg").remove();

  if (confirmRaw.length > 0) {
    if (confirmRaw.length === 12 && accountRaw === confirmRaw) {
      $(this).addClass("success").removeClass("error default");
      form.find(".account-match-msg").show();
      lucide.createIcons();
    } else if (confirmRaw.length > 0 && confirmRaw.length < 12) {
      $(this).addClass("error").removeClass("default success");
      form.find(".account-match-msg").hide();

      formGroup.append(`
                <div class="confirm-error-msg">
                    <i data-lucide="info" class="red-icon"></i>
                    <p class="urc-p">
                        Account number not matched
                    </p>
                </div>
            `);
      lucide.createIcons();
    } else if (confirmRaw.length === 12 && accountRaw !== confirmRaw) {
      $(this).addClass("error").removeClass("default success");
      form.find(".account-match-msg").hide();

      formGroup.append(`
                <div class="confirm-error-msg">
                    <i data-lucide="info" class="red-icon"></i>
                    <p class="urc-p">
                        Account number not matched
                    </p>
                </div>
            `);
      lucide.createIcons();
    }
  } else {
    $(this).addClass("default").removeClass("error success");
    form.find(".account-match-msg").hide();
  }

  validateBankForm(form);
});

$(document).on("change", ".start-date, .end-date", function () {
  const form = $(this).closest(".bank-account-form");
  const startDate = form.find(".start-date").val();
  const endDate = form.find(".end-date").val();
  const endDateInput = form.find(".end-date");
  const startDateInput = form.find(".start-date");
  const endDateFormGroup = form.find("#calender-second");
  const startDateFormGroup = form.find(".mobile");

  form.find("#calender-second .date-error-msg").remove();
  form.find(".mobile .date-error-msg").remove();

  endDateFormGroup.removeClass("date-error");
  startDateFormGroup.removeClass("date-error");

  startDateInput.addClass("default").removeClass("error success");
  endDateInput.addClass("default").removeClass("error success");

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start.getTime() === end.getTime()) {
      endDateInput.addClass("error").removeClass("default success");
      startDateInput.addClass("default").removeClass("error success");

      endDateFormGroup.addClass("date-error");
      startDateFormGroup.addClass("date-error");

      form.find("#calender-second").append(`
        <div class="date-error-msg">
          <i data-lucide="info" class="red-icon"></i>
          <p class="urc-p">
            Start and end dates cannot be the same. Please select a valid date range.
          </p>
        </div>
      `);
      lucide.createIcons();
    } else if (end < start) {
      endDateInput.addClass("error").removeClass("default success");
      startDateInput.addClass("default").removeClass("error success");

      endDateFormGroup.addClass("date-error");
      startDateFormGroup.addClass("date-error");

      form.find("#calender-second").append(`
        <div class="date-error-msg">
          <i data-lucide="info" class="red-icon"></i>
          <p class="urc-p">
            End date cannot be earlier than start date. Please select a valid date range.
          </p>
        </div>
      `);
      lucide.createIcons();
    } else {
      startDateInput.addClass("default").removeClass("error success");
      endDateInput.addClass("default").removeClass("error success");
      endDateFormGroup.removeClass("date-error");
      startDateFormGroup.removeClass("date-error");
    }
  } else if (startDate && !endDate) {
    startDateInput.addClass("default").removeClass("error success");
  } else if (!startDate && endDate) {
    endDateInput.addClass("default").removeClass("error success");
  }

  validateBankForm(form);
});

$(document).ready(function () {
  $("#agreeTerms").prop("disabled", true);
  $("#agreeTerms").prop("checked", false);
  $("#acceptTermsBtn").prop("disabled", true);

  let hasScrolledToBottom = false;
  let scrollTimeout = null;

  function checkTermsScrollComplete() {
    const termsScroll = document.querySelector(".terms-scroll");
    if (!termsScroll) return;

    const scrollTop = termsScroll.scrollTop;
    const scrollHeight = termsScroll.scrollHeight;
    const clientHeight = termsScroll.clientHeight;
    const scrolledToBottom = scrollTop + clientHeight >= scrollHeight - 5;

    if (scrolledToBottom && !hasScrolledToBottom) {
      hasScrolledToBottom = true;

      $("#agreeTerms").prop("disabled", false);
      $("#agreeTerms").prop("checked", false);
      $("#acceptTermsBtn").prop("disabled", true);

      showScrollCompleteFeedback();
    } else if (!scrolledToBottom) {
    }
  }

  function attachScrollListener() {
    const termsScroll = document.querySelector(".terms-scroll");
    if (termsScroll) {
      termsScroll.removeEventListener("scroll", handleScroll);
      termsScroll.addEventListener("scroll", handleScroll);
    }
  }

  function handleScroll() {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      checkTermsScrollComplete();
    }, 50);
  }

  attachScrollListener();

  $(document).on("click", "#applySanctionProceedBtn", function () {
    $("#applySanctionModal").hide();

    $("#termsModal").show();
    setTimeout(() => {
      hasScrolledToBottom = false;
      $(".scroll-complete-msg").remove();
      $(".scroll-required-msg").remove();

      $("#agreeTerms").prop("disabled", true);
      $("#agreeTerms").prop("checked", false);
      $("#acceptTermsBtn").prop("disabled", true);

      const termsScroll = document.querySelector(".terms-scroll");
      if (termsScroll) {
        termsScroll.scrollTop = 0;
        termsScroll.removeEventListener("scroll", handleScroll);
        termsScroll.addEventListener("scroll", handleScroll);
      }
    }, 200);

    setTimeout(attachScrollListener, 300);
  });

  $(document).on("change", "#agreeTerms", function () {
    const isChecked = $(this).is(":checked");
    $("#acceptTermsBtn").prop("disabled", !isChecked);
  });

  $(document).on("click", "#agreeTerms", function (e) {
    if ($(this).prop("disabled")) {
      e.preventDefault();
      showScrollingRequiredMessage();
    }
  });

  $(document).on(
    "click",
    "#termsModal .outline-orange-btn, #termsModal .close-modal",
    function () {
      hasScrolledToBottom = false;
      $(".scroll-complete-msg").remove();
      $(".scroll-required-msg").remove();

      $("#agreeTerms").prop("disabled", true);
      $("#agreeTerms").prop("checked", false);
      $("#acceptTermsBtn").prop("disabled", true);

      const termsScroll = document.querySelector(".terms-scroll");
      if (termsScroll) {
        termsScroll.scrollTop = 0;
      }

      $("#termsModal").hide();
      $("#applySanctionModal").show();

      $("#agreeTerms").prop("checked", false);
      $("#acceptTermsBtn").prop("disabled", true);
    },
  );
});

function initializeOtpSystem() {
  setupOtpFlow(
    "emailOtpBox",
    "emailOtpTimer",
    "verifyEmailOtpBtn",
    "email-id",
    "email",
  );
  setupOtpFlow(
    "emailOtpBoxMobile",
    "emailOtpTimerMobile",
    "verifyEmailOtpBtnMobile",
    "email-id-2",
    "email",
  );

  setupOtpFlow(
    "gstOtpBox",
    "gstOtpTimer",
    "verifyGstOtpBtn",
    "gst-section",
    "gst",
  );
}

function resetOtpBox(otpBox) {
  otpBox.find(".otp-inputs input").each(function () {
    $(this).val("");
    $(this).removeClass("otp-error").addClass("otp-default");
  });

  otpBox.find(".otp-error-msg").remove();

  const isGst = otpBox.closest("#gstOtpBox").length > 0;
  const isEmailMobile = otpBox.closest("#emailOtpBoxMobile").length > 0;

  if (isGst) {
    clearInterval(gstTimerInterval);
    gstTimerInterval = null;
  } else if (isEmailMobile) {
    clearInterval(emailTimerInterval);
    emailTimerInterval = null;
  } else {
    clearInterval(emailTimerInterval);
    emailTimerInterval = null;
  }

  const resendWrapper = otpBox.find(".otp-resend-wrapper");
  if (resendWrapper.length) {
    const timerId = isGst
      ? "gstOtpTimer"
      : isEmailMobile
        ? "emailOtpTimerMobile"
        : "emailOtpTimer";

    resendWrapper.html(`
      <span>
        Resend OTP after
        <span id="${timerId}">03:00</span>
      </span>
    `);

    resendWrapper.find(".otp-resent-confirmation, .otp-resend-text").remove();
  }
}

function setupOtpFlow(otpBoxId, timerId, verifyBtnId, containerId, type) {
  let timerInterval = null;
  let attempts = 0;
  const otpBox = $(`#${otpBoxId}`);
  const timerElement = $(`#${timerId}`);
  const verifyBtn = $(`#${verifyBtnId}`);
  const container = $(`#${containerId}`);

  if (otpBox.length === 0 || verifyBtn.length === 0) {
    return;
  }

  verifyBtn.off("click");
  otpBox.off("click", ".resend-link");

  otpBox
    .find(".otp-inputs input")
    .off("input")
    .on("input", function () {
      $(this).removeClass("otp-error").addClass("otp-default");
      otpBox.find(".otp-error-msg").remove();
      if ($(this).val().length === 1) {
        $(this).next("input").focus();
      }
    });

  otpBox
    .find(".otp-inputs input")
    .off("keydown")
    .on("keydown", function (e) {
      if (e.key === "Backspace" && $(this).val() === "") {
        $(this).prev("input").focus();
      }
    });

  otpBox
    .find(".otp-toggle")
    .off("click")
    .on("click", function () {
      const isVisible = $(this).attr("data-visible") === "true";
      const inputs = otpBox.find(".otp-inputs input");
      if (isVisible) {
        inputs.attr("type", "password");
        $(this).text("visibility_off").attr("data-visible", "false");
      } else {
        inputs.attr("type", "text");
        $(this).text("visibility").attr("data-visible", "true");
      }
    });

  otpBox
    .find(".otp-close")
    .off("click")
    .on("click", function () {
      clearInterval(timerInterval);
      otpBox.slideUp();
      if (type === "email") {
        container.find(".verify-link").show();
      } else if (type === "gst") {
        $("#gstCustomSelect").show();
        $(".gstinTrigger").show();
        $("#gstVerifyBtn").show();
        $("#gstinpara").show();
      }
      resetOtpBox(otpBox);
    });

  verifyBtn.on("click", function () {
    const otp = getOtpValue(otpBox);

    if (otp.length !== 6) {
      showOtpError(otpBox, "Please enter complete 6-digit OTP");
      return;
    }

    if (otp === "111111") {
      handleOtpSuccess(otpBox, container, type);
      clearInterval(timerInterval);
    } else {
      attempts++;
      handleOtpError(otpBox, attempts);
      clearInterval(timerInterval);
      showResendOption(otpBox, timerId, type);
    }
  });

  otpBox
    .off("click", ".resend-link, .gst-resend-link")
    .on("click", ".resend-link, .gst-resend-link", function (e) {
      e.preventDefault();
      e.stopPropagation();
      handleResendOtp(otpBox, timerId, type);
    });

  function startOtpCountdown() {
    clearInterval(timerInterval);
    let duration = 180;

    updateTimerDisplay(timerElement, duration);

    timerInterval = setInterval(function () {
      duration--;
      updateTimerDisplay(timerElement, duration);

      if (duration <= 0) {
        clearInterval(timerInterval);
        showResendOption(otpBox, timerId, type);
        return;
      }
    }, 1000);

    return timerInterval;
  }

  function updateTimerDisplay(element, duration) {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    element.text(
      `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
    );
  }

  function handleResendOtp(otpBox, timerId, type) {
    otpBox.find(".otp-inputs input").val("");
    otpBox
      .find(".otp-inputs input")
      .removeClass("otp-error")
      .addClass("otp-default");
    otpBox.find(".otp-error-msg").remove();

    attempts = 0;

    const resendClass = type === "gst" ? "gst-resend-link" : "resend-link";

    otpBox.find(".otp-resend-wrapper").html(`
            <span class="otp-resend-text">
                Resend OTP after
                <span id="${timerId}">03:00</span>
            </span>
            <span class="otp-resent-confirmation otp-resent-left">
                <i data-lucide="circle-check" class="check-icon-circle"></i>
                OTP re-sent
            </span>
        `);

    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }

    startOtpCountdown();
    otpBox.find(".otp-inputs input:first").focus();
  }

  function showResendOption(otpBox, timerId, type) {
    const resendClass = type === "gst" ? "gst-resend-link" : "resend-link";

    otpBox.find(".otp-resend-wrapper").html(`
            <span class="otp-resend-text">
                Didn't receive OTP?
                <a href="#" class="${resendClass}">
                    Resend OTP
                </a>
            </span>
        `);

    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }
  }

  function handleOtpSuccess(otpBox, container, type) {
    otpBox.slideUp();

    if (type === "email") {
      container.find(".verify-link").replaceWith(`
                <span class="verified-status">
                    <i data-lucide="circle-check" class="check-icon-circle"></i>
                    Email verified
                </span>
            `);
      emailVerified = true;
    } else if (type === "gst") {
      $(".gstinTrigger").addClass("gstin-valid").removeClass("gstin-invalid");
      $(".gst-error-msg").remove();
      $(".gst-verified-status").remove();
      $(".gstin").after(`
                <div class="verified-status gst-verified-status">
                    <i data-lucide="circle-check"></i>
                    GSTIN verified
                </div>
            `);
      $("#gstCustomSelect").show();
      $("#gstinpara").hide();
      $("#gstVerifyBtn").hide();
      $("#uploadGst").hide();
      gstVerified = true;
    }

    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }

    checkStep1Completion();
  }

  function handleOtpError(otpBox, attempts) {
    otpBox
      .find(".otp-inputs input")
      .addClass("otp-error")
      .removeClass("otp-default");

    otpBox.find(".otp-error-msg").remove();

    otpBox.find(".otp-row").after(`
            <div class="otp-error-msg">
                <i data-lucide="info" class="red-icon"></i>
                <span class="error-msg-incorrect">
                    Incorrect OTP. Please try again (Attempt ${attempts}/3)
                </span>
            </div>
        `);

    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }
  }

  function showOtpError(otpBox, message) {
    otpBox.find(".otp-error-msg").remove();
    otpBox.find(".otp-row").after(`
            <div class="otp-error-msg">
                <i data-lucide="info" class="red-icon"></i>
                <span class="error-msg-incorrect">
                    ${message}
                </span>
            </div>
        `);
    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }
  }

  function getOtpValue(otpBox) {
    let otp = "";
    otpBox.find(".otp-inputs input").each(function () {
      otp += $(this).val();
    });
    return otp;
  }

  if (type === "gst") {
    $(document)
      .off("click", "#gstVerifyBtn")
      .on("click", "#gstVerifyBtn", function (e) {
        e.preventDefault();
        e.stopPropagation();

        resetOtpBox(otpBox);

        $("#gstCustomSelect").hide();
        $(".gstinTrigger").hide();
        $(".custom-select-options").hide();
        $("#gstVerifyBtn").hide();
        $("#gstinpara").hide();

        otpBox.slideDown(300, function () {
          otpBox.find(".otp-inputs input:first").focus();
        });

        startOtpTimer();
      });
  }

  if (type === "email") {
    container
      .off("click", ".verify-link")
      .on("click", ".verify-link", function () {
        otpBox.slideDown(function () {
          otpBox.find(".otp-inputs input:first").focus();
        });
        container.find(".otp-email-display, #email-id").hide();
        $(this).hide();

        resetOtpBox(otpBox);
        startOtpTimer();
      });
  }
}

function simulateOtpSuccess(otpBoxId) {
  const otpBox = $(`#${otpBoxId}`);
  if (otpBox.length === 0) return;

  const inputs = otpBox.find(".otp-inputs input");
  inputs.each(function (index) {
    $(this).val("111111"[index] || "");
  });

  const verifyBtn = otpBox
    .closest(".otp-box")
    .find(
      ".verify-otp-btn, #verifyGstOtpBtn, #verifyEmailOtpBtn, #verifyEmailOtpBtnMobile",
    );
  if (verifyBtn.length) {
    verifyBtn.click();
  }
}

function simulateOtpError(otpBoxId) {
  const otpBox = $(`#${otpBoxId}`);
  if (otpBox.length === 0) return;

  const inputs = otpBox.find(".otp-inputs input");
  inputs.each(function (index) {
    $(this).val("222222"[index] || "");
  });

  const verifyBtn = otpBox
    .closest(".otp-box")
    .find(
      ".verify-otp-btn, #verifyGstOtpBtn, #verifyEmailOtpBtn, #verifyEmailOtpBtnMobile",
    );
  if (verifyBtn.length) {
    verifyBtn.click();
  }
}

$(document).ready(function () {
  initializeOtpSystem();

  $(document).on("change", "#gstSelect", function () {
    const selectedValue = $(this).val();
    if (selectedValue !== "") {
      $("#gstVerifyBtn").show();
    } else {
      $("#gstVerifyBtn").hide();
      $("#gstOtpBox").hide();
      $("#gstCustomSelect").show();
    }
    checkStep1Completion();
  });
});

$(document).on("click", "#cancelStep3Btn", function () {
  $("#step3Modal").hide();

  $("#step2Modal").show();
});

$(document).on("click", "#cancelBtn", function () {
  $("#applySanctionModal").hide();
});

$(document).on("click", "#cancelStep2Btn", function () {
  $("#step2Modal").hide();

  $("#step1Modal").show();
});

function updateUrcSectionMargin() {
  const gstToggle = $(".verification-section .toggle-row .switch input").is(
    ":checked",
  );
  const urcToggle = $(".urc-section .toggle-row .switch input").is(":checked");

  if (gstToggle && urcToggle) {
    $(".urc-section").addClass("margin");
  } else {
    $(".urc-section").addClass("margin");
  }
}

$(document).ready(function () {
  updateUrcSectionMargin();
});

$(document).on("change", ".toggle-row .switch input", function () {
  updateUrcSectionMargin();
});

$(document).on("click", ".partner-accordion-header", function (e) {
  e.stopPropagation();
  var currentAccordion = $(this).closest(".partner-accordion");
  var currentContent = currentAccordion.find(".partner-accordion-content");
  var currentIcon = $(this).find(".material-icons");

  $(".partner-accordion")
    .not(currentAccordion)
    .each(function () {
      var otherContent = $(this).find(".partner-accordion-content");
      var otherIcon = $(this).find(".partner-accordion-header .material-icons");
      if ($(this).hasClass("active")) {
        $(this).removeClass("active");
        otherContent.slideUp(200);
        otherIcon.text("expand_more");
      }
    });

  if (currentAccordion.hasClass("active")) {
    currentAccordion.removeClass("active");
    currentContent.slideUp(200);
    currentIcon.text("expand_more");
  } else {
    currentAccordion.addClass("active");
    currentContent.slideDown(200);
    currentIcon.text("expand_less");
    validatePartnerAccordion(currentAccordion);
  }
});

$(document).on("click", ".partner-reset-btn", function () {
  var accordion = $(this).closest(".partner-accordion");
  accordion
    .find("input[type='text'], input[type='number'], input[type='date']")
    .val("");
  accordion.find(".selected-option").each(function () {
    var defaultText = $(this).closest(".proprietor-gender").length
      ? "Mr."
      : $(this).text();
    if ($(this).closest(".proprietor-gender-section").length) {
      var label = $(this)
        .closest(".proprietor-gender-section")
        .find("label")
        .first()
        .text()
        .trim();
      if (label === "Gender") $(this).text("Select gender");
      if (label === "Community") $(this).text("Select community");
      if (label === "Category") $(this).text("Select category");
    }
  });
  accordion.find(".error-step3-handle").hide();
  accordion.find(".is-error").removeClass("is-error");
  validatePartnerAccordion(accordion);
});

$(document).on("click", ".partner-save-btn", function () {
  var accordion = $(this).closest(".partner-accordion");
  var num = accordion.data("partner");
  var content = accordion.find(".partner-accordion-content");

  var titleSelect = content
    .find(".proprietor-gender .selected-option")
    .first()
    .text()
    .trim();
  var firstName = content
    .find('input[placeholder="Enter first name"]')
    .val()
    .trim();
  var middleName = content
    .find('input[placeholder="Enter middle name"]')
    .val()
    .trim();
  var lastName = content
    .find('input[placeholder="Enter last name"]')
    .val()
    .trim();
  var fullName = titleSelect + " " + firstName;
  if (middleName) fullName += " " + middleName;
  if (lastName) fullName += " " + lastName;

  var mobile = content
    .find('input[placeholder="10 digit mobile number"]')
    .val()
    .trim();
  var email = content.find('input[placeholder="Enter ID"]').val().trim();
  var pan = content
    .find('input[placeholder="Enter PAN"]')
    .val()
    .trim()
    .toUpperCase();
  var ownership = content.find('input[placeholder="0"]').val().trim();
  var gender = content
    .find(".proprietor-gender-section .selected-option")
    .first()
    .text()
    .trim();
  var dob = content.find('input[type="date"]').val();

  var communityEls = content.find(
    ".proprietor-gender-section .selected-option",
  );
  var community =
    communityEls.length > 1 ? communityEls.eq(1).text().trim() : "";
  var category =
    communityEls.length > 2 ? communityEls.eq(2).text().trim() : "";
  var address = content.find('input[placeholder="Enter address"]').val().trim();
  var pincode = content
    .find('input[placeholder="Enter pin code"]')
    .val()
    .trim();

  if (gender === "Select gender") gender = "";
  if (community === "Select community") community = "";
  if (category === "Select category") category = "";

  var mobileDisplay = mobile ? "+91 " + mobile : "";
  var ownershipDisplay = ownership ? ownership + "%" : "";
  var addressDisplay = address;
  if (pincode) addressDisplay += ", " + pincode;

  var summaryHtml =
    '<div class="partner-summary">' +
    '<div class="partner-summary-grid">' +
    "<div>" +
    '<p class="partner-summary-label">Name</p>' +
    '<p class="partner-summary-value">' +
    fullName +
    "</p>" +
    "</div>" +
    "<div>" +
    '<p class="partner-summary-label">Mobile number</p>' +
    '<p class="partner-summary-value">' +
    mobileDisplay +
    "</p>" +
    "</div>" +
    "<div>" +
    '<p class="partner-summary-label">Email ID</p>' +
    '<p class="partner-summary-value">' +
    email +
    "</p>" +
    "</div>" +
    "<div>" +
    '<p class="partner-summary-label">PAN</p>' +
    '<p class="partner-summary-value">' +
    pan +
    "</p>" +
    "</div>" +
    "<div>" +
    '<p class="partner-summary-label">Ownership control</p>' +
    '<p class="partner-summary-value">' +
    ownershipDisplay +
    "</p>" +
    "</div>" +
    "<div>" +
    '<p class="partner-summary-label">Gender</p>' +
    '<p class="partner-summary-value">' +
    gender +
    "</p>" +
    "</div>" +
    "<div>" +
    '<p class="partner-summary-label">Date of birth</p>' +
    '<p class="partner-summary-value">' +
    dob +
    "</p>" +
    "</div>" +
    "<div>" +
    '<p class="partner-summary-label">Community</p>' +
    '<p class="partner-summary-value">' +
    community +
    "</p>" +
    "</div>" +
    "<div>" +
    '<p class="partner-summary-label">Category</p>' +
    '<p class="partner-summary-value">' +
    category +
    "</p>" +
    "</div>" +
    "<div>" +
    '<p class="partner-summary-label">Address</p>' +
    '<p class="partner-summary-value">' +
    addressDisplay +
    "</p>" +
    "</div>" +
    "</div>" +
    "</div>";

  accordion.find(".partner-summary").remove();
  accordion
    .find(".partner-accordion-header")
    .find(".partner-edit-btn")
    .remove();
  accordion
    .find(".partner-accordion-header")
    .find("i.material-icons")
    .hide()
    .end()
    .append(
      '<span class="partner-edit-btn">' +
        '<i class="material-icons">edit</i> Edit' +
        "</span>",
    );

  content.hide();
  accordion.removeClass("active");
  accordion.find(".partner-accordion-header").after(summaryHtml);
  accordion.addClass("saved");

  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }

  checkAllPartnersSaved();
});

$(document).on("click", ".partner-edit-btn", function (e) {
  e.stopPropagation();
  var accordion = $(this).closest(".partner-accordion");
  accordion.find(".partner-summary").remove();
  accordion.find(".partner-edit-btn").remove();
  accordion
    .find(".partner-accordion-header i.material-icons")
    .show()
    .text("expand_less");
  accordion.addClass("active").removeClass("saved");
  accordion.find(".partner-accordion-content").slideDown(200);

  checkAllPartnersSaved();
});

function getPartnerFormHtml(num) {
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
    '<div class="custom-select-wrapper">' +
    '<div class="custom-select-trigger">' +
    '<span class="selected-option">Mr.</span>' +
    '<div class="select-right"><i class="material-icons">expand_more</i></div>' +
    "</div>" +
    '<div class="custom-select-options" style="display: none">' +
    '<div class="option-item" data-value="mr">Mr.</div>' +
    '<div class="option-item" data-value="miss">Miss.</div>' +
    '<div class="option-item" data-value="ms">Ms.</div>' +
    '<div class="option-item" data-value="dr">Dr.</div>' +
    "</div>" +
    "</div>" +
    '<select style="display: none"><option value="mr">Mr.</option><option value="miss">Miss.</option><option value="ms">Ms.</option><option value="dr">Dr.</option></select>' +
    "</div>" +
    '<div class="field-wrapper">' +
    "<label>First name as per PAN</label>" +
    '<input type="text" placeholder="Enter first name" />' +
    '<div class="error-step3-handle" style="display: none"><i data-lucide="info"></i><p>Entered first name is in wrong format, please enter a valid name.</p></div>' +
    "</div>" +
    "</div>" +
    "<div>" +
    '<div class="properties-middle">' +
    '<div class="custom-properties-middle">' +
    '<label>Middle name <span class="incorporation-yy">(optional)</span></label>' +
    '<input type="text" placeholder="Enter middle name" />' +
    "</div>" +
    '<div class="custom-properties-middle field-wrapper error-state-pan">' +
    "<label>Last name as per PAN</label>" +
    '<input type="text" placeholder="Enter last name" />' +
    '<div class="error-step3-handle" style="display: none"><i data-lucide="info"></i><p>please enter a valid last name.</p></div>' +
    '<div class="error-step3-handle"><i data-lucide="info"></i><p>Please enter name as per PAN</p></div>' +
    "</div>" +
    "</div>" +
    "</div>" +
    '<div class="field-wrapper">' +
    "<label>Mobile number</label>" +
    '<div class="properties-mobile-number-section">' +
    '<input type="text" placeholder="10 digit mobile number" maxlength="10" />' +
    "</div>" +
    '<div class="error-step3-handle" style="display: none"><i data-lucide="info"></i><p>Entered mobile number is in wrong format, please enter a valid 10-digit number.</p></div>' +
    "</div>" +
    '<div class="field-wrapper">' +
    '<label>Email ID <i data-lucide="info" class="chevron-icon info-icon icon-css" data-tooltip="Contract will be sent on this email"></i></label>' +
    '<input type="text" placeholder="Enter ID" />' +
    '<div class="error-step3-handle" style="display: none"><i data-lucide="info"></i><p>Entered email ID is in wrong format, please enter a valid email id.</p></div>' +
    "</div>" +
    '<div class="field-wrapper">' +
    "<label>PAN number</label>" +
    '<input id="panNumber" type="text" placeholder="Enter PAN" maxlength="10" />' +
    '<div class="error-step3-handle" style="display: none"><i data-lucide="info"></i><p>Please enter a valid PAN number.</p></div>' +
    "</div>" +
    '<div class="field-wrapper">' +
    '<label>Ownership control <i data-lucide="info" class="chevron-icon info-icon icon-css" data-tooltip="Percentage of ownership in the partnership"></i></label>' +
    '<div class="position">' +
    '<input type="text" class="ownership-input" placeholder="0" />' +
    '<span class="percentage-owner">%</span>' +
    "</div>" +
    "</div>" +
    "<div>" +
    '<div class="proprietor-gender-section">' +
    "<label>Gender</label>" +
    '<div class="custom-select-wrapper">' +
    '<div class="custom-select-trigger">' +
    '<span class="selected-option">Select gender</span>' +
    '<div class="select-right"><i class="material-icons">expand_more</i></div>' +
    "</div>" +
    '<div class="custom-select-options" style="display: none">' +
    '<div class="option-item" data-value="select-gender">Select gender</div>' +
    '<div class="option-item" data-value="male">Male</div>' +
    '<div class="option-item" data-value="female">Female</div>' +
    '<div class="option-item" data-value="others">Others</div>' +
    "</div>" +
    "</div>" +
    '<select style="display: none"><option value="select-gender">Select gender</option><option value="male">Male</option><option value="female">Female</option><option value="others">Others</option></select>' +
    "</div>" +
    "</div>" +
    "<div>" +
    '<div class="width">' +
    '<label>Date of birth as per aadhaar <span class="incorporation-yy">(yyyy-mm-dd)</span></label>' +
    '<div class="date-input custom-datepicker-wrap">' +
    '<input type="date" class="dobDate" placeholder="Select date (yyyy-mm-dd)" readonly />' +
    '<div class="custom-calendar-popup" style="display:none"></div>' +
    "</div>" +
    "</div>" +
    "</div>" +
    "</div>" +
    '<div class="proprietor-grid">' +
    "<div>" +
    '<div class="field-wrapper">' +
    "<label>Address</label>" +
    '<input type="text" placeholder="Enter address" />' +
    '<div class="error-step3-handle" style="display: none"><i data-lucide="info"></i><p>Please enter a valid Address</p></div>' +
    "</div>" +
    '<div class="field-wrapper city-field cityAddressBlock">' +
    '<label>City <span class="urc-p">*</span></label>' +
    '<div class="custom-select-wrapper" id="cityCustomSelect">' +
    '<div class="custom-select-trigger">' +
    '<span class="selected-option">Select city</span>' +
    '<div class="select-right">' +
    '<i class="material-icons">expand_more</i>' +
    "</div>" +
    "</div>" +
    '<div class="custom-select-options" style="display: none">' +
    '<div class="option-item" data-value="">Select city</div>' +
    "</div>" +
    "</div>" +
    '<select style="display: none">' +
    '<option value="">Select city</option>' +
    "</select>" +
    '<div class="error-step3-handle city-error" style="display: none">' +
    '<i data-lucide="info"></i>' +
    "<p>Please select a city.</p>" +
    "</div>" +
    "</div>" +
    "</div>" +
    "<div>" +
    '<div class="field-wrapper">' +
    "<label>Pin code</label>" +
    '<input type="number" inputmode="numeric" placeholder="Enter pin code" maxlength="6" class="pincode-input" />' +
    '<div class="error-step3-handle" style="display: none"><i data-lucide="info"></i><p>Entered pin code is in wrong format, please enter a valid 6 digit pin.</p></div>' +
    "</div>" +
    '<div class="field-wrapper city-field cityAddressBlock">' +
    '<label>State <span class="urc-p">*</span></label>' +
    '<div class="state-display-wrapper">' +
    '<input type="text" id="state" class="state-input" placeholder="State" readonly />' +
    "</div>" +
    "</div>" +
    "</div>" +
    "<div>" +
    '<div class="proprietor-gender-section">' +
    "<label>Community</label>" +
    '<div class="custom-select-wrapper">' +
    '<div class="custom-select-trigger">' +
    '<span class="selected-option">Select community</span>' +
    '<div class="select-right"><i class="material-icons">expand_more</i></div>' +
    "</div>" +
    '<div class="custom-select-options" style="display: none">' +
    '<div class="option-item" data-value="select-community">Select community</div>' +
    '<div class="option-item" data-value="hindu">Hindu</div>' +
    '<div class="option-item" data-value="muslim">Muslim</div>' +
    '<div class="option-item" data-value="sikh">Sikh</div>' +
    '<div class="option-item" data-value="christian">Christian</div>' +
    '<div class="option-item" data-value="jain">Jain</div>' +
    '<div class="option-item" data-value="buddhist">Buddhist</div>' +
    '<div class="option-item" data-value="parsi">Parsi</div>' +
    '<div class="option-item" data-value="others">Others</div>' +
    "</div>" +
    "</div>" +
    '<select style="display: none"><option value="select-community">Select community</option><option value="hindu">Hindu</option><option value="muslim">Muslim</option><option value="sikh">Sikh</option><option value="christian">Christian</option><option value="jain">Jain</option><option value="buddhist">Buddhist</option><option value="parsi">Parsi</option><option value="others">Others</option></select>' +
    "</div>" +
    "</div>" +
    "<div>" +
    '<div class="proprietor-gender-section">' +
    "<label>Category</label>" +
    '<div class="custom-select-wrapper">' +
    '<div class="custom-select-trigger">' +
    '<span class="selected-option">Select category</span>' +
    '<div class="select-right"><i class="material-icons">expand_more</i></div>' +
    "</div>" +
    '<div class="custom-select-options" style="display: none">' +
    '<div class="option-item" data-value="select-category">Select category</div>' +
    '<div class="option-item" data-value="general">General</div>' +
    '<div class="option-item" data-value="obc">OBC</div>' +
    '<div class="option-item" data-value="sc">SC</div>' +
    '<div class="option-item" data-value="st">ST</div>' +
    '<div class="option-item" data-value="ews">EWS</div>' +
    "</div>" +
    "</div>" +
    '<select style="display: none"><option value="select-category">Select category</option><option value="general">General</option><option value="obc">OBC</option><option value="sc">SC</option><option value="st">ST</option><option value="ews">EWS</option></select>' +
    "</div>" +
    "</div>" +
    "</div>" +
    '<div class="proprietor-grid">' +
    "<div>" +
    "</div>" +
    '<div class="partner-asset-top">' +
    '<button class="partner-reset-btn">Reset</button>' +
    '<button class="partner-save-btn" disabled>Save</button>' +
    "</div>" +
    "</div>" +
    "</div>" +
    "</div>"
  );
}

$(document).on("input", "#partnerCount", function () {
  var count = parseInt($(this).val()) || 0;
  var $container = $("#partnerAccordionContainer");

  if (count < 2) {
    $container.empty();
    return;
  }

  if (count > 20) {
    count = 20;
    $(this).val(20);
  }

  var currentCount = $container.find(".partner-accordion").length;

  if (count > currentCount) {
    for (var i = currentCount + 1; i <= count; i++) {
      $container.append(getPartnerFormHtml(i));
    }
    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }
  } else if (count < currentCount) {
    $container.find(".partner-accordion").each(function () {
      if ($(this).data("partner") > count) {
        $(this).remove();
      }
    });
  }

  checkAllPartnersSaved();
});

$(document).on("input", "#partnerCount", function () {
  var count = parseInt($(this).val()) || 0;
  var errorDiv = $(this).siblings(".error-step3-handle");

  if (errorDiv.length === 0) {
    errorDiv = $(
      '<div class="error-step3-handle" style="display: none"><i data-lucide="info"></i><p>Please enter at least 2 partners.</p></div>',
    );
    $(this).after(errorDiv);
    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }
  }

  if (count < 2 && $(this).val() !== "") {
    errorDiv.show();
    $(this).addClass("is-error");
  } else {
    errorDiv.hide();
    $(this).removeClass("is-error");
  }
});

$(document).on("focus", "#partnerCount", function () {
  var errorDiv = $(this).siblings(".error-step3-handle");
  if (errorDiv.length) {
    errorDiv.hide();
  }
  $(this).removeClass("is-error");
});

function checkAllPartnersSaved() {
  var count = parseInt($("#partnerCount").val()) || 0;
  var total = $("#partnerAccordionContainer .partner-accordion").length;
  var saved = $("#partnerAccordionContainer .partner-accordion.saved").length;

  if (count >= 2 && count <= 20 && total === count && saved === count) {
    $("#step3NextBtn")
      .prop("disabled", false)
      .addClass("btn-enabled")
      .removeClass("btn-disabled");
    $("#step3Modal .modal-footer p")
      .addClass("enabled")
      .removeClass("disabled");
  } else {
    $("#step3NextBtn")
      .prop("disabled", true)
      .addClass("btn-disabled")
      .removeClass("btn-enabled");
    $("#step3Modal .modal-footer p")
      .addClass("disabled")
      .removeClass("enabled");
  }
}

function validatePartnerAccordion(accordion) {
  if (!accordion || accordion.hasClass("saved")) return;
  var content = accordion.find(".partner-accordion-content");
  if (!content.length || content.hasClass("d-none")) return;

  var firstName = content
    .find('input[placeholder="Enter first name"]')
    .val()
    .trim();
  var lastName = content
    .find('input[placeholder="Enter last name"]')
    .val()
    .trim();
  var mobile = content
    .find('input[placeholder="10 digit mobile number"]')
    .val()
    .trim();
  var email = content.find('input[placeholder="Enter ID"]').val().trim();
  var pan = content.find('input[placeholder="Enter PAN"]').val().trim();
  var ownership = content.find('input[placeholder="0"]').val().trim();
  var gender = content
    .find(".proprietor-gender-section .selected-option")
    .first()
    .text()
    .trim();
  var dob = content.find('input[type="date"]').val();
  var communityEls = content.find(
    ".proprietor-gender-section .selected-option",
  );
  var community =
    communityEls.length > 1 ? communityEls.eq(1).text().trim() : "";
  var category =
    communityEls.length > 2 ? communityEls.eq(2).text().trim() : "";
  var address = content.find('input[placeholder="Enter address"]').val().trim();
  var pincode = content
    .find('input[placeholder="Enter pin code"]')
    .val()
    .trim();

  var mobileClean = mobile.replace(/^\+91\s*/, "").replace(/\s/g, "");

  var mobileDigits = mobileClean.replace(/\D/g, "");

  var isValid =
    firstName !== "" &&
    lastName !== "" &&
    mobileDigits.length === 10 &&
    email !== "" &&
    email.indexOf("@") !== -1 &&
    email.indexOf(".") !== -1 &&
    pan.length === 10 &&
    ownership !== "" &&
    gender !== "Select gender" &&
    dob !== "" &&
    community !== "Select community" &&
    category !== "Select category" &&
    address !== "" &&
    /^[a-zA-Z0-9\s]+$/.test(address) &&
    pincode.length === 6;

  var btn = accordion.find(".partner-save-btn");
  btn.prop("disabled", !isValid);
  if (isValid) {
    btn.addClass("enabled").removeClass("disabled");
  } else {
    btn.addClass("disabled").removeClass("enabled");
  }
}

$(document).on(
  "input change",
  ".partner-accordion-content input, .partner-accordion-content select",
  function () {
    var accordion = $(this).closest(".partner-accordion");
    if (accordion.length && !accordion.hasClass("saved")) {
      setTimeout(function () {
        validatePartnerAccordion(accordion);
      }, 0);
    }
  },
);

// Global Input Validations added for Data Integrity
$(document).on(
  "input",
  'input[placeholder="Enter first name"], input[placeholder="Enter middle name"], input[placeholder="Enter last name"], input[placeholder="Enter name"]',
  function () {
    $(this).val(
      $(this)
        .val()
        .replace(/[^a-zA-Z\s]/g, ""),
    );
  },
);

$(document).on(
  "input",
  'input[placeholder="10 digit mobile number"]',
  function () {
    $(this).val($(this).val().replace(/\D/g, "").slice(0, 10));
  },
);

$(document).on("input", 'input[placeholder="Enter ID"]', function () {
  $(this).val($(this).val().replace(/\s/g, ""));
});

$(document).on(
  "blur",
  '.properties-mobile-number-section input[placeholder="10 digit mobile number"], input[placeholder="10 digit mobile number"]',
  function () {
    var val = $(this).val().replace(/\D/g, "");
    var errorDiv = siblingErrorDiv(this);
    var parent = $(this).closest(".field-wrapper");

    if (errorDiv.length === 0 && parent.length) {
      errorDiv = parent.find(".error-step3-handle");
      if (errorDiv.length === 0) {
        errorDiv = $(
          '<div class="error-step3-handle" style="display: none"><i data-lucide="info"></i><p>Please enter a valid 10-digit mobile number.</p></div>',
        );
        parent.append(errorDiv);
        if (typeof lucide !== "undefined") {
          lucide.createIcons();
        }
      }
    }

    if (val.length > 0 && val.length < 10) {
      errorDiv.show();
      $(this).addClass("is-error");
    } else if (val.length === 0) {
      errorDiv.hide();
      $(this).removeClass("is-error");
    } else if (val.length === 10) {
      errorDiv.hide();
      $(this).removeClass("is-error").addClass("is-success");
    }
  },
);

$(document).on(
  "blur",
  'input[placeholder="10 digit mobile number"]',
  function () {
    const $input = $(this);
    let value = $input.val().trim();

    if (value && !value.startsWith("+91")) {
      value = value.replace(/^\+91\s*/, "");
      $input.val("+91 " + value);
    }
  },
);

$(document).on(
  "focusout",
  'input[placeholder="10 digit mobile number"]',
  function () {
    const $input = $(this);
    let value = $input.val().trim();

    if (value && !value.startsWith("+91")) {
      value = value.replace(/^\+91\s*/, "");
      $input.val("+91 " + value);
    }
  },
);

$(document).on("blur", 'input[placeholder="Enter ID"]', function () {
  var val = $(this).val().trim();
  var errorDiv = siblingErrorDiv(this);
  var parent = $(this).closest(".field-wrapper");

  if (errorDiv.length === 0 && parent.length) {
    errorDiv = parent.find(".error-step3-handle");
    if (errorDiv.length === 0) {
      errorDiv = $(
        '<div class="error-step3-handle" style="display: none"><i data-lucide="info"></i><p>Please enter a valid email address.</p></div>',
      );
      parent.append(errorDiv);
      if (typeof lucide !== "undefined") {
        lucide.createIcons();
      }
    }
  }

  if (val.length > 0 && (val.indexOf("@") === -1 || val.indexOf(".") === -1)) {
    errorDiv.show();
    $(this).addClass("is-error");
  } else if (val.length === 0) {
    errorDiv.hide();
    $(this).removeClass("is-error");
  } else {
    errorDiv.hide();
    $(this).removeClass("is-error").addClass("is-success");
  }
});

$(document).on("blur", 'input[placeholder="Enter pin code"]', function () {
  var val = $(this).val().replace(/\D/g, "");
  var errorDiv = siblingErrorDiv(this);
  var parent = $(this).closest(".field-wrapper");

  if (errorDiv.length === 0 && parent.length) {
    errorDiv = parent.find(".error-step3-handle");
    if (errorDiv.length === 0) {
      errorDiv = $(
        '<div class="error-step3-handle" style="display: none"><i data-lucide="info"></i><p>Please enter a valid 6-digit pin code.</p></div>',
      );
      parent.append(errorDiv);
      if (typeof lucide !== "undefined") {
        lucide.createIcons();
      }
    }
  }

  if (val.length > 0 && val.length !== 6) {
    errorDiv.show();
    $(this).addClass("is-error");
  } else if (val.length === 0) {
    errorDiv.hide();
    $(this).removeClass("is-error");
  } else if (val.length === 6) {
    errorDiv.hide();
    $(this).removeClass("is-error").addClass("is-success");
    if (typeof populateCityAndState === "function") {
      populateCityAndState(val);
    }
  }
});

$(document).on(
  "focus",
  '.properties-mobile-number-section input[placeholder="10 digit mobile number"], input[placeholder="10 digit mobile number"]',
  function () {
    var errorDiv = siblingErrorDiv(this);
    if (errorDiv.length) {
      errorDiv.hide();
    }
    $(this).removeClass("is-error");
  },
);

$(document).on("focus", 'input[placeholder="Enter ID"]', function () {
  var errorDiv = siblingErrorDiv(this);
  if (errorDiv.length) {
    errorDiv.hide();
  }
  $(this).removeClass("is-error");
});

$(document).on("focus", 'input[placeholder="Enter pin code"]', function () {
  var errorDiv = siblingErrorDiv(this);
  if (errorDiv.length) {
    errorDiv.hide();
  }
  $(this).removeClass("is-error");
  if ($(this).val().replace(/\D/g, "").length < 6) {
    document.getElementsByClassName("cityAddressBlock").style.display = "none";
  }
});

$(document).on("input", 'input[placeholder="Enter address"]', function () {
  $(this).val(
    $(this)
      .val()
      .replace(/[^a-zA-Z0-9\s]/g, ""),
  );
});

$(document).on(
  "input",
  'input[placeholder="Enter PAN"], input[placeholder="ENTER PAN"]',
  function () {
    $(this).val(
      $(this)
        .val()
        .replace(/[^a-zA-Z0-9]/g, "")
        .toUpperCase()
        .slice(0, 10),
    );
  },
);

$(document).on("input", "#idProofNumber", function () {
  $(this).val(
    $(this)
      .val()
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase(),
  );
});

$(document).on(
  "input",
  "#foreignHedged, #foreignUnhedged, #totalForeignExposure, #totalBankingExposure",
  function () {
    $(this).val(
      $(this)
        .val()
        .replace(/[^0-9.]/g, ""),
    );
  },
);

// Open Accordian
$(document).ready(function () {
  $(document).on("click", ".opne-accordian, .accordion-header", function () {
    const parent = $(this).closest(".accordian, .review-accordion");

    parent.toggleClass("active");

    const content = parent.find(".accordian-content");
    const chevronIcon = parent.find(".accordion-icon");

    if (parent.hasClass("active")) {
      content.slideDown(200);
      chevronIcon.addClass("rotated");
    } else {
      content.slideUp(200);
      chevronIcon.removeClass("rotated");
    }

    $(".accordian, .review-accordion")
      .not(parent)
      .each(function () {
        $(this).removeClass("active");
        $(this).find(".accordian-content").slideUp(200);
        $(this).find(".accordion-icon").removeClass("rotated");
      });
  });
});

$(document).ready(function () {
  function convertToUppercase(input) {
    var value = $(input).val();
    if (value) {
      var start = input.selectionStart;
      var end = input.selectionEnd;

      var upperValue = value.toUpperCase();

      if (value !== upperValue) {
        $(input).val(upperValue);

        input.setSelectionRange(start, end);
      }
    }
  }

  var inputIds = ["#gstUsername", "#leiNumber", "#idProofNumber", "#panNumber"];

  inputIds.forEach(function (id) {
    $(document).on("input", id, function () {
      convertToUppercase(this);
    });

    $(document).on("blur", id, function () {
      convertToUppercase(this);
    });

    $(document).on("change", id, function () {
      convertToUppercase(this);
    });
  });

  $(document).on("paste", function (e) {
    var target = e.target;
    var id = "#" + target.id;

    if (inputIds.includes(id)) {
      setTimeout(function () {
        convertToUppercase(target);
      }, 10);
    }
  });
});

let editingBankIndex = null;
let editingBankData = null;
let editFormId = null;

function getBankCardTitle(index) {
  if (index === 0) return "Primary account";
  if (index === 1) return "Secondary account";
  return `Account ${index + 1}`;
}

function createEditBankForm(data, cardIndex, title = "Primary account") {
  const bankName = getBankName(data.bank);
  const accountType = getAccountTypeName(data.type);

  return `
    <div class="bank-account-form edit-bank-form" data-form-id="${Date.now()}" data-edit-index="${cardIndex}">
      <div class="edit-form-header">
        <h4>Edit ${title}</h4>
        <i class="material-icons close-edit-form">delete</i>
      </div>

      <div class="bank-grid">
        <div class="form-group">
          <label class="field-label">Name of bank</label>
          <div class="custom-select-wrapper bank-name-select">
            <div class="custom-select-trigger">
              <span class="selected-option">${bankName}</span>
              <div class="select-right">
                <i class="material-icons">expand_more</i>
              </div>
            </div>
            <div class="custom-select-options" style="display: none">
              <div class="option-item" data-value="">Select bank</div>
              <div class="option-item" data-value="icici">ICICI Bank</div>
              <div class="option-item" data-value="hdfc">HDFC Bank</div>
              <div class="option-item" data-value="sbi">State Bank of India</div>
              <div class="option-item" data-value="axis">Axis Bank</div>
              <div class="option-item" data-value="kotak">Kotak Mahindra Bank</div>
              <div class="option-item" data-value="yes">Yes Bank</div>
              <div class="option-item" data-value="idfc">IDFC First Bank</div>
              <div class="option-item" data-value="pnb">Punjab National Bank</div>
              <div class="option-item" data-value="canara">Canara Bank</div>
              <div class="option-item" data-value="other">Other</div>
            </div>
          </div>
          <select class="bank-name" style="display: none" value="${data.bank}">
            <option value="">Select bank</option>
            <option value="icici" ${data.bank === "icici" ? "selected" : ""}>ICICI Bank</option>
            <option value="hdfc" ${data.bank === "hdfc" ? "selected" : ""}>HDFC Bank</option>
            <option value="sbi" ${data.bank === "sbi" ? "selected" : ""}>State Bank of India</option>
            <option value="axis" ${data.bank === "axis" ? "selected" : ""}>Axis Bank</option>
            <option value="kotak" ${data.bank === "kotak" ? "selected" : ""}>Kotak Mahindra Bank</option>
            <option value="yes" ${data.bank === "yes" ? "selected" : ""}>Yes Bank</option>
            <option value="idfc" ${data.bank === "idfc" ? "selected" : ""}>IDFC First Bank</option>
            <option value="pnb" ${data.bank === "pnb" ? "selected" : ""}>Punjab National Bank</option>
            <option value="canara" ${data.bank === "canara" ? "selected" : ""}>Canara Bank</option>
            <option value="other" ${data.bank === "other" ? "selected" : ""}>Other</option>
          </select>
        </div>

        <div class="form-group">
          <label class="field-label">Account type</label>
          <div class="custom-select-wrapper account-type-select">
            <div class="custom-select-trigger">
              <span class="selected-option">${accountType}</span>
              <div class="select-right">
                <i class="material-icons">expand_more</i>
              </div>
            </div>
            <div class="custom-select-options" style="display: none">
              <div class="option-item" data-value="">Select account type</div>
              <div class="option-item" data-value="current">Current account</div>
              <div class="option-item" data-value="savings">Savings account</div>
              <div class="option-item" data-value="overdraft">Overdraft account</div>
              <div class="option-item" data-value="cash-credit">Cash credit account</div>
            </div>
          </div>
          <select class="account-type" style="display: none" value="${data.type}">
            <option value="">Select account type</option>
            <option value="current" ${data.type === "current" ? "selected" : ""}>Current account</option>
            <option value="savings" ${data.type === "savings" ? "selected" : ""}>Savings account</option>
            <option value="overdraft" ${data.type === "overdraft" ? "selected" : ""}>Overdraft account</option>
            <option value="cash-credit" ${data.type === "cash-credit" ? "selected" : ""}>Cash credit account</option>
          </select>
        </div>
      </div>

      <div class="bank-grid">
        <div class="form-group first-account">
          <label class="field-label">Account number</label>
          <input
            type="text"
            class="account-number"
            placeholder="Enter account number"
            value="${data.fullAccount || "xxxx xxxx xxxx"}"
          />
        </div>

        <div class="form-group">
          <label class="field-label">Confirm account number</label>
          <input
            type="text"
            class="confirm-account-number"
            placeholder="Confirm account number"
            value="${data.fullAccount || ""}"
          />
          <p class="account-match-msg" ${data.fullAccount ? "visible" : "hidden"}">
            <i data-lucide="check-circle"></i>
            Account numbers matched
          </p>
        </div>
      </div>

      <div class="bank-grid calender-grid">
        <div class="form-group mobile">
          <label class="field-label">Bank statement start date <i
              data-lucide="info"
              class="info-icon icon-css"
              data-tooltip="Enter start date as shown on your bank statement"
            ></i></label>
          <div class="date-input range-datepicker-wrap">
            <input type="text" readonly class="start-date" placeholder="mm/dd/yyyy" value="${data.start || ""}" />
            
            <div class="range-calendar-popup" style="display:none"></div>
          </div>
        </div>

        <div class="form-group" id="calender-second">
          <label class="field-label">Bank statement end date <i
              data-lucide="info"
              class="info-icon icon-css"
              data-tooltip="Enter the end date as shown on your bank statement. Must be after the start date"
            ></i></label>
          <div class="date-input range-datepicker-wrap">
            <input type="text" readonly class="end-date" placeholder="mm/dd/yyyy" value="${data.end || ""}" />
            
            <div class="range-calendar-popup" style="display:none"></div>
          </div>
        </div>
      </div>

      <div class="bank-grid bank-margin">
        <div class="form-group upload-group">
          <label class="field-label">Bank statement</label>

          <div class="upload-drop-zone itr-upload bank-upload ${data.file && data.file !== "Upload / Drag & Drop file" ? "uploaded" : ""}" data-year="2022-23">
            <div class="upload-left-icon">
                <span class="material-symbols-outlined">${data.file && data.file !== "Upload / Drag & Drop file" ? "draft" : "draft"}</span>
              </div>

            <div class="upload-content">
              <div class="upload-title ${data.file && data.file !== "Upload / Drag & Drop file" ? "has-file" : ""}">
                ${data.file || "Upload / Drag & Drop file"}
              </div>
              <div class="upload-info">
                (Max size: 2MB | Format: PDF, Excel)
              </div>
            </div>

            <div class="upload-right-icon">
              <i data-lucide="upload"></i>
            </div>

            <input
              type="file"
              class="upload-file-input"
              accept=".pdf,.xls,.xlsx"
              hidden
            />
          </div>
        </div>

        <div></div>

        <div class="bank-actions">
          <span class="reset-bank cancel-btn">Cancel</span>

          <button class="save-bank-btn update-bank-btn" disabled>
            Update
          </button>
        </div>
      </div>

    </div>
  `;
}

function createBankCardWithEdit(data, title = "Primary account", index = 0) {
  const bankName = getBankName(data.bank);
  const accountType = getAccountTypeName(data.type);
  const isPrimary = index === 0;
  const fullAccount = data.fullAccount || data.account.replace(/\s/g, "");

  return `
  <div class="Bank-card-contain" 
       data-account="${data.account.replace(/\s/g, "")}" 
       data-index="${index}" 
       data-full-account="${fullAccount}">
    <div class="bank-title">${title}</div>
    <div class="bank-actions-icons">
      ${!isPrimary ? `<span class="bank-delete-icon" data-index="${index}"><i class="material-icons">delete</i></span>` : ""}
      ${!isPrimary ? `<span class="bank-edit-icon" data-index="${index}"><i class="material-icons">edit</i> Edit</span>` : ""}
    </div>
    <div class="saved-bank-card">
      <div>
        <label>Bank</label>
        <p>${bankName}</p>
      </div>

      <div>
        <label>Account type</label>
        <p>${accountType}</p>
      </div>

      <div>
        <label>Account number</label>
        <p>${data.account}</p>
      </div>

      <div>
        <label>Statement period</label>
        <p>${data.start} - ${data.end}</p>
      </div>

      <div>
        <label>File name</label>
        <p class="last-child">${data.file} <small class="last-child-small">File size: 1.8MB</small></p>
      </div>
    </div>
  </div>`;
}

const originalCreateBankCard = createBankCard;
createBankCard = function (data, title = "Primary account") {
  const index = $(".Bank-card-contain").length;
  return createBankCardWithEdit(data, title, index);
};

$(document).on("click", ".bank-edit-icon", function () {
  const cardIndex = $(this).data("index");
  const card = $(this).closest(".Bank-card-contain");
  const cardData = {
    bank: $(card).find(".saved-bank-card div:first p").text().trim(),
    type: $(card).find(".saved-bank-card div:nth-child(2) p").text().trim(),
    account: $(card).find(".saved-bank-card div:nth-child(3) p").text().trim(),
    start:
      $(card)
        .find(".saved-bank-card div:nth-child(4) p")
        .text()
        .trim()
        .split(" - ")[0] || "",
    end:
      $(card)
        .find(".saved-bank-card div:nth-child(4) p")
        .text()
        .trim()
        .split(" - ")[1] || "",
    file: $(card).find(".saved-bank-card div:nth-child(5) p").text().trim(),
    fullAccount: $(card).data("full-account") || "1111 1111 1111",
  };

  const bankMapReverse = {
    "ICICI Bank": "icici",
    "HDFC Bank": "hdfc",
    "State Bank of India": "sbi",
    "Axis Bank": "axis",
    "Kotak Mahindra Bank": "kotak",
    "Yes Bank": "yes",
    "IDFC First Bank": "idfc",
    "Punjab National Bank": "pnb",
    "Canara Bank": "canara",
    Other: "other",
  };

  const typeMapReverse = {
    "Current account": "current",
    "Savings account": "savings",
    "Overdraft account": "overdraft",
    "Cash credit account": "cash-credit",
  };

  cardData.bank = bankMapReverse[cardData.bank] || "icici";
  cardData.type = typeMapReverse[cardData.type] || "current";

  editingBankIndex = cardIndex;
  editingBankData = cardData;

  $("#addBankAccount").addClass("disabled").removeClass("enabled");

  toggleStep4Buttons(false);

  const title = card.find(".bank-title").text().trim();
  card.replaceWith(createEditBankForm(cardData, cardIndex, title));

  const form = $(".edit-bank-form");
  form.data("original-card", card.clone());

  form.find(".custom-select-trigger").removeClass("active");
  form.find(".custom-select-options").hide();

  validateEditForm(form);
  lucide.createIcons();
});

$(document).on("click", ".close-edit-form", function () {
  const form = $(this).closest(".edit-bank-form");
  const cardIndex = form.data("edit-index");

  restoreCardFromEdit(form);

  $("#addBankAccount").removeClass("disabled").addClass("enabled");

  checkStep4Completion();

  editingBankIndex = null;
  editingBankData = null;
});

function restoreCardFromEdit(form) {
  const cardIndex = form.data("edit-index");
  const title = form.find("h4").text().replace("Edit ", "").trim();

  const bankName = form
    .find(".bank-name-select .selected-option")
    .text()
    .trim();
  const accountType = form
    .find(".account-type-select .selected-option")
    .text()
    .trim();
  const accountNumber = form.find(".account-number").val() || "xxxx xxxx xxxx";
  const startDate = form.find(".start-date").val() || "";
  const endDate = form.find(".end-date").val() || "";
  const fileText = form.find(".upload-title").text().trim();

  const bankMap = {
    "ICICI Bank": "icici",
    "HDFC Bank": "hdfc",
    "State Bank of India": "sbi",
    "Axis Bank": "axis",
    "Kotak Mahindra Bank": "kotak",
    "Yes Bank": "yes",
    "IDFC First Bank": "idfc",
    "Punjab National Bank": "pnb",
    "Canara Bank": "canara",
    Other: "other",
  };

  const typeMap = {
    "Current account": "current",
    "Savings account": "savings",
    "Overdraft account": "overdraft",
    "Cash credit account": "cash-credit",
  };

  const data = {
    bank: bankMap[bankName] || "icici",
    type: typeMap[accountType] || "current",
    account: "xxxx xxxx xxxx",
    start: startDate,
    end: endDate,
    file: fileText,
    fullAccount: "xxxx xxxx xxxx",
  };

  const cardHtml = createBankCardWithEdit(data, title, cardIndex);
  form.replaceWith(cardHtml);
  lucide.createIcons();
}

function validateEditForm(form) {
  const bankText = form
    .find(".bank-name-select .selected-option")
    .text()
    .trim();
  const typeText = form
    .find(".account-type-select .selected-option")
    .text()
    .trim();

  const bank = bankText !== "Select bank" && bankText !== "";
  const type = typeText !== "Select account type" && typeText !== "";

  const accountInput = form.find(".account-number");
  const confirmInput = form.find(".confirm-account-number");

  const accountRaw =
    accountInput.data("original-account") ||
    accountInput.val().replace(/\s/g, "");
  const confirmRaw = confirmInput.val().replace(/\s/g, "");

  const account = accountRaw.length === 12;
  const confirm = confirmRaw.length === 12 && accountRaw === confirmRaw;

  const start = form.find(".start-date").val();
  const end = form.find(".end-date").val();

  let dateValid = false;
  if (start && end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (startDate.getTime() !== endDate.getTime() && endDate > startDate) {
      dateValid = true;
    }
  }

  const uploaded =
    form.find(".upload-drop-zone").hasClass("uploaded") ||
    form.find(".upload-title").text().trim() !== "Upload / Drag & Drop file";

  const complete = bank && type && account && confirm && dateValid && uploaded;

  const updateBtn = form.find(".update-bank-btn");
  updateBtn.prop("disabled", !complete);

  if (complete) {
    updateBtn.addClass("enabled").removeClass("disabled");
    $(".cancel-btn").addClass("enabled").removeClass("disabled");

    toggleStep4Buttons(true);
  } else {
    updateBtn.addClass("disabled").removeClass("enabled");

    $(".cancel-btn").addClass("disabled").removeClass("enabled");

    toggleStep4Buttons(false);
  }

  return complete;
}

$(document).on("click", ".update-bank-btn", function () {
  const form = $(this).closest(".edit-bank-form");
  const cardIndex = form.data("edit-index");
  const title = form.find("h4").text().replace("Edit ", "").trim();

  const accountNumber =
    form.find(".account-number").data("original-account") ||
    form.find(".account-number").val().replace(/\s/g, "");
  const cleanNewAccount = accountNumber.replace(/\s/g, "");

  let isDuplicate = false;

  if (cleanNewAccount.length === 12) {
    const savedCards = $(".Bank-card-contain");
    savedCards.each(function () {
      const currentCardIndex = $(this).data("index");
      if (currentCardIndex === cardIndex) return true;

      const fullAccount =
        $(this).data("full-account") ||
        $(this).data("account") ||
        $(this)
          .find(".saved-bank-card div:nth-child(3) p")
          .text()
          .trim()
          .replace(/\s/g, "");

      if (fullAccount === cleanNewAccount) {
        isDuplicate = true;
        return false;
      }
    });
  }

  if (isDuplicate) {
    const formGroup = form.find(".form-group.first-account");
    const existingError = formGroup.find(".duplicate-error-msg");

    if (existingError.length === 0) {
      formGroup.append(`
        <div class="duplicate-error-msg">
          <i data-lucide="info" class="red-icon"></i>
          <p class="urc-p"
            This account number is already added. Please enter a different account number.
          </p>
        </div>
      `);
      lucide.createIcons();
    }
    return;
  }

  form.find(".form-group.first-account .duplicate-error-msg").remove();

  const bankName = form
    .find(".bank-name-select .selected-option")
    .text()
    .trim();
  const accountType = form
    .find(".account-type-select .selected-option")
    .text()
    .trim();
  const accountNumberDisplay = form.find(".account-number").val();
  const startDate = form.find(".start-date").val() || "";
  const endDate = form.find(".end-date").val() || "";
  const fileText = form.find(".upload-title").text().trim();

  const bankMap = {
    "ICICI Bank": "icici",
    "HDFC Bank": "hdfc",
    "State Bank of India": "sbi",
    "Axis Bank": "axis",
    "Kotak Mahindra Bank": "kotak",
    "Yes Bank": "yes",
    "IDFC First Bank": "idfc",
    "Punjab National Bank": "pnb",
    "Canara Bank": "canara",
    Other: "other",
  };

  const typeMap = {
    "Current account": "current",
    "Savings account": "savings",
    "Overdraft account": "overdraft",
    "Cash credit account": "cash-credit",
  };

  const data = {
    bank: bankMap[bankName] || "icici",
    type: typeMap[accountType] || "current",
    account: "xxxx xxxx xxxx",
    start: startDate,
    end: endDate,
    file: fileText,
    fullAccount: accountNumber,
  };

  if (cardIndex >= 0 && cardIndex < bankAccounts.length) {
    bankAccounts[cardIndex] = data;
  } else {
    const existingIndex = bankAccounts.findIndex(
      (b) =>
        b.fullAccount === accountNumber ||
        b.account.replace(/\s/g, "") === accountNumber,
    );
    if (existingIndex >= 0) {
      bankAccounts[existingIndex] = data;
    } else {
      bankAccounts.push(data);
    }
  }

  const cardHtml = createBankCardWithEdit(data, title, cardIndex);
  form.replaceWith(cardHtml);

  $("#addBankAccount").removeClass("disabled").addClass("enabled");

  editingBankIndex = null;
  editingBankData = null;
  isFormUnsaved = false;

  checkStep4Completion();

  lucide.createIcons();
});

$(document).on("click", ".edit-bank-form .reset-bank", function () {
  const form = $(this).closest(".edit-bank-form");
  restoreCardFromEdit(form);

  $("#addBankAccount").removeClass("disabled").addClass("enabled");

  checkStep4Completion();

  editingBankIndex = null;
  editingBankData = null;
});

$(document).on("click", ".save-bank-btn:not(.update-bank-btn)", function () {
  const form = $(this).closest(".bank-account-form");
  if (form.hasClass("edit-bank-form")) return;

  const title = form.find("h4").text().trim();

  const accountRaw =
    form.find(".account-number").data("original-account") ||
    form.find(".account-number").val().replace(/\s/g, "");
  const accountNumber = accountRaw;

  if (isDuplicateAccount(accountNumber, form)) {
    const formGroup = form.find(".form-group.first-account");
    const existingError = formGroup.find(".duplicate-error-msg");

    if (existingError.length === 0) {
      formGroup.append(`
        <div class="duplicate-error-msg">
          <i data-lucide="info" class="red-icon"></i>
          <p class="urc-p">
            This account number is already added. Please enter a different account number.
          </p>
        </div>
      `);
      lucide.createIcons();
    }
    return;
  }

  form.find(".form-group.first-account .duplicate-error-msg").remove();

  const bankValue = form.find(".bank-name").val();
  const typeValue = form.find(".account-type").val();

  const data = {
    bank: bankValue,
    type: typeValue,
    account: "xxxx xxxx xxxx",
    start: form.find(".start-date").val(),
    end: form.find(".end-date").val(),
    file: form.find(".upload-title").text(),
    fullAccount: accountRaw,
  };

  bankAccounts.push(data);

  const cardIndex = bankAccounts.length - 1;
  form.replaceWith(createBankCardWithEdit(data, title, cardIndex));

  isFormUnsaved = false;
  $("#addBankAccount").removeClass("disabled").addClass("enabled");

  checkStep4Completion();
  lucide.createIcons();
});

function createBankFormWithClose(title = "Primary account") {
  return `
    <div class="bank-account-form" data-form-id="${Date.now()}">
      <div class="edit-form-header">
        <h4>${title}</h4>
        ${title !== "Primary account" ? '<i class="material-icons close-bank-form">delete</i>' : ""}
      </div>

      <div class="bank-grid">
        <div class="form-group">
          <label class="field-label">Name of bank</label>
          <div class="custom-select-wrapper bank-name-select">
            <div class="custom-select-trigger">
              <span class="selected-option">Select bank</span>
              <div class="select-right">
                <i class="material-icons">expand_more</i>
              </div>
            </div>
            <div class="custom-select-options" style="display: none">
              <div class="option-item" data-value="">Select bank</div>
              <div class="option-item" data-value="icici">ICICI Bank</div>
              <div class="option-item" data-value="hdfc">HDFC Bank</div>
              <div class="option-item" data-value="sbi">State Bank of India</div>
              <div class="option-item" data-value="axis">Axis Bank</div>
              <div class="option-item" data-value="kotak">Kotak Mahindra Bank</div>
              <div class="option-item" data-value="yes">Yes Bank</div>
              <div class="option-item" data-value="idfc">IDFC First Bank</div>
              <div class="option-item" data-value="pnb">Punjab National Bank</div>
              <div class="option-item" data-value="canara">Canara Bank</div>
              <div class="option-item" data-value="other">Other</div>
            </div>
          </div>
          <select class="bank-name" style="display: none">
            <option value="">Select bank</option>
            <option value="icici">ICICI Bank</option>
            <option value="hdfc">HDFC Bank</option>
            <option value="sbi">State Bank of India</option>
            <option value="axis">Axis Bank</option>
            <option value="kotak">Kotak Mahindra Bank</option>
            <option value="yes">Yes Bank</option>
            <option value="idfc">IDFC First Bank</option>
            <option value="pnb">Punjab National Bank</option>
            <option value="canara">Canara Bank</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div class="form-group">
          <label class="field-label">Account type</label>
          <div class="custom-select-wrapper account-type-select">
            <div class="custom-select-trigger">
              <span class="selected-option">Select account type</span>
              <div class="select-right">
                <i class="material-icons">expand_more</i>
              </div>
            </div>
            <div class="custom-select-options" style="display: none">
              <div class="option-item" data-value="">Select account type</div>
              <div class="option-item" data-value="current">Current account</div>
              <div class="option-item" data-value="savings">Savings account</div>
              <div class="option-item" data-value="overdraft">Overdraft account</div>
              <div class="option-item" data-value="cash-credit">Cash credit account</div>
            </div>
          </div>
          <select class="account-type" style="display: none">
            <option value="">Select account type</option>
            <option value="current">Current account</option>
            <option value="savings">Savings account</option>
            <option value="overdraft">Overdraft account</option>
            <option value="cash-credit">Cash credit account</option>
          </select>
        </div>
      </div>

      <div class="bank-grid">
        <div class="form-group first-account">
          <label class="field-label">Account number</label>
          <input
            type="text"
            class="account-number"
            placeholder="Enter account number"
          />
        </div>

        <div class="form-group">
          <label class="field-label">Confirm account number</label>
          <input
            type="text"
            class="confirm-account-number"
            placeholder="Confirm account number"
          />
          <p class="account-match-msg" style="display:none">
            <i data-lucide="check-circle"></i>
            Account numbers matched
          </p>
        </div>
      </div>

      <div class="bank-grid calender-grid">
        <div class="form-group mobile">
          <label class="field-label">Bank statement start date <i
              data-lucide="info"
              class="info-icon icon-css"
              data-tooltip="Enter start date as shown on your bank statement"
            ></i></label>
          <div class="date-input range-datepicker-wrap"><input type="text" readonly class="start-date" placeholder="mm/dd/yyyy"  /><div class="range-calendar-popup" style="display:none"></div></div>
        </div>

        <div class="form-group" id="calender-second">
          <label class="field-label">Bank statement end date <i
              data-lucide="info"
              class="info-icon icon-css"
              data-tooltip="Enter the end date as shown on your bank statement. Must be after the start date"
            ></i></label>
          <div class="date-input range-datepicker-wrap"><input type="text" readonly class="end-date" placeholder="mm/dd/yyyy" /><div class="range-calendar-popup" style="display:none"></div></div>
        </div>
      </div>

      <div class="bank-grid bank-margin">
        <div class="form-group upload-group">
          <label class="field-label">Bank statement</label>

          <div class="upload-drop-zone itr-upload bank-upload" data-year="2022-23">
            <div class="upload-left-icon">
                <span class="material-symbols-outlined">draft</span>
              </div>

            <div class="upload-content">
              <div class="upload-title">Upload / Drag & Drop file</div>
              <div class="upload-info">
                (Max size: 2MB | Format: PDF, Excel)
              </div>
            </div>

            <div class="upload-right-icon">
              <i data-lucide="upload"></i>
            </div>

            <input
              type="file"
              class="upload-file-input"
              accept=".pdf,.xls,.xlsx"
              hidden
            />
          </div>
        </div>

        <div></div>

        <div class="bank-actions">
          <span class="reset-bank">Reset</span>

          <button class="save-bank-btn" disabled>
            Save
          </button>
        </div>
      </div>

    </div>
  `;
}

const originalCreateBankForm = createBankForm;
createBankForm = function (title = "Primary account") {
  return createBankFormWithClose(title);
};

$(document).on("click", ".close-bank-form", function () {
  const form = $(this).closest(".bank-account-form");
  form.remove();

  isFormUnsaved = false;
  $("#addBankAccount").removeClass("disabled").addClass("enabled");

  checkStep4Completion();
});

$(document)
  .off("click", "#addBankAccount")
  .on("click", "#addBankAccount", function () {
    if (isFormUnsaved || $(this).hasClass("disabled")) {
      return;
    }

    const bankCount = $(".Bank-card-contain").length;
    let title = "";

    if (bankCount === 0) {
      title = "Primary account";
    } else if (bankCount === 1) {
      title = "Secondary account";
    } else {
      title = `Account ${bankCount + 1}`;
    }

    if ($(".bank-account-form").length > 0) {
      $(".bank-account-form")
        .last()
        .replaceWith(createBankFormWithClose(title));
    } else {
      $("#bankAccountContainer").append(createBankFormWithClose(title));
    }

    lucide.createIcons();
    isFormUnsaved = true;
    $(this).addClass("disabled").removeClass("enabled");
  });

const originalValidateBankForm = validateBankForm;
validateBankForm = function (form) {
  if (form.hasClass("edit-bank-form")) {
    return validateEditForm(form);
  }
  return originalValidateBankForm(form);
};

$(document).on("click", ".bank-delete-icon", function () {
  const cardIndex = $(this).data("index");
  const card = $(this).closest(".Bank-card-contain");
  const title = card.find(".bank-title").text().trim();

  if (cardIndex >= 0 && cardIndex < bankAccounts.length) {
    bankAccounts.splice(cardIndex, 1);
  }

  card.remove();

  $(".Bank-card-contain").each(function (index) {
    $(this).data("index", index);
    $(this).find(".bank-edit-icon").data("index", index);
    $(this).find(".bank-delete-icon").data("index", index);
  });

  checkStep4Completion();
  lucide.createIcons();
});

function formatIndianCurrency(input) {
  let value = input.value.replace(/[^0-9.]/g, "");

  if (value === "") {
    input.value = "";
    return;
  }

  let parts = value.split(".");
  let integerPart = parts[0];
  let decimalPart = parts.length > 1 ? "." + parts[1] : "";

  integerPart = integerPart.replace(/^0+/, "") || "0";

  let formattedInteger = integerPart;
  if (integerPart.length > 3) {
    let lastThree = integerPart.slice(-3);
    let remaining = integerPart.slice(0, -3);
    let groups = [];
    for (let i = remaining.length; i > 0; i -= 2) {
      groups.unshift(remaining.slice(Math.max(0, i - 2), i));
    }
    formattedInteger = groups.join(",") + "," + lastThree;
  }

  input.value = formattedInteger + decimalPart;
}

$(document).on(
  "input",
  "#foreignHedged, #foreignUnhedged, #totalForeignExposure, #totalBankingExposure",
  function () {
    formatIndianCurrency(this);
  },
);

$(document).on(
  "blur",
  "#foreignHedged, #foreignUnhedged, #totalForeignExposure, #totalBankingExposure",
  function () {
    formatIndianCurrency(this);
  },
);

$(document).on("click", "#modalCloseBtn", function () {
  $("#applySanctionModal").hide();
});

const pincodeData = {
  400051: {
    cities: ["Bandra East", "Mumbai"],
    state: "Maharashtra",
  },
  400001: {
    cities: ["Fort", "Mumbai"],
    state: "Maharashtra",
  },
  110001: {
    cities: ["Connaught Place", "New Delhi"],
    state: "Delhi",
  },
  110002: {
    cities: ["Daryaganj", "New Delhi"],
    state: "Delhi",
  },
  500001: {
    cities: ["Abids", "Hyderabad"],
    state: "Telangana",
  },
  500034: {
    cities: ["Banjara Hills", "Hyderabad"],
    state: "Telangana",
  },
  700001: {
    cities: ["Dalhousie Square", "Kolkata"],
    state: "West Bengal",
  },
  700020: {
    cities: ["Park Street", "Kolkata"],
    state: "West Bengal",
  },
};

function populateCityAndState(pincode) {
  const citySelect = document.querySelector("#step3Modal #cityCustomSelect");
  const stateDisplay = document.getElementById("state");
  const cityDisplay = document.getElementById("city");

  if (!pincode || pincode.length < 6) {
    const cityBlocks = document.querySelectorAll(".cityAddressBlock");
    cityBlocks.forEach((block) => {
      block.style.display = "none";
    });

    if (citySelect) {
      const trigger = citySelect.querySelector(
        ".custom-select-trigger .selected-option",
      );
      if (trigger) {
        trigger.textContent = "Select city";
      }
      const hiddenSelect = citySelect.parentElement.querySelector("select");
      if (hiddenSelect) {
        hiddenSelect.value = "";
      }
    }

    if (stateDisplay) {
      stateDisplay.value = "";
    }
    if (cityDisplay) {
      cityDisplay.value = "";
    }
    return;
  }

  const data = pincodeData[pincode];

  const cityBlocks = document.querySelectorAll(".cityAddressBlock");
  cityBlocks.forEach((block) => {
    block.style.display = "block";
  });

  if (data) {
    if (stateDisplay) {
      stateDisplay.value = data.state;
    }

    if (citySelect) {
      const optionsContainer = citySelect.querySelector(
        ".custom-select-options",
      );
      const triggerSpan = citySelect.querySelector(
        ".custom-select-trigger .selected-option",
      );
      const hiddenSelect = citySelect.parentElement.querySelector("select");

      if (optionsContainer) {
        optionsContainer.innerHTML = "";

        data.cities.forEach((city) => {
          const option = document.createElement("div");
          option.className = "option-item";
          option.dataset.value = city;
          option.textContent = city;
          optionsContainer.appendChild(option);
        });
      }

      if (data.cities.length > 0) {
        const firstCity = data.cities[0];

        if (triggerSpan) {
          triggerSpan.textContent = firstCity;
          triggerSpan.classList.remove("placeholder");
        }

        if (hiddenSelect) {
          hiddenSelect.value = firstCity;
          hiddenSelect.dispatchEvent(new Event("change"));
        }

        if (optionsContainer) {
          const options = optionsContainer.querySelectorAll(".option-item");
          options.forEach((opt) => {
            opt.classList.remove("selected");
            if (opt.dataset.value === firstCity) {
              opt.classList.add("selected");
            }
          });
        }
      }

      setupCityDropdownHandlers();
    }

    if (cityDisplay) {
      cityDisplay.value = data.cities[0] || "";
    }
  } else {
    if (stateDisplay) {
      stateDisplay.value = "Not found";
    }

    if (citySelect) {
      const optionsContainer = citySelect.querySelector(
        ".custom-select-options",
      );
      const triggerSpan = citySelect.querySelector(
        ".custom-select-trigger .selected-option",
      );

      if (optionsContainer) {
        optionsContainer.innerHTML = "";
        const defaultOpt = document.createElement("div");
        defaultOpt.className = "option-item";
        defaultOpt.dataset.value = "";
        defaultOpt.textContent = "Select city";
        optionsContainer.appendChild(defaultOpt);
      }

      if (triggerSpan) {
        triggerSpan.textContent = "Select city";
      }
    }

    if (cityDisplay) {
      cityDisplay.value = "Not found";
    }
  }
}

function setupCityDropdownHandlers() {
  const citySelect = document.querySelector("#step3Modal #cityCustomSelect");
  if (!citySelect) return;

  citySelect
    .querySelector(".custom-select-trigger")
    ?.addEventListener("click", function (e) {
      e.stopPropagation();
      const wrapper = this.closest(".custom-select-wrapper");
      const options = wrapper.querySelector(".custom-select-options");
      const isOpen = options.style.display === "block";

      document.querySelectorAll(".custom-select-options").forEach((opt) => {
        if (opt !== options) {
          opt.style.display = "none";
        }
      });
      document.querySelectorAll(".custom-select-trigger").forEach((trig) => {
        if (trig !== this) {
          trig.classList.remove("active");
        }
      });

      if (isOpen) {
        options.style.display = "none";
        this.classList.remove("active");
      } else {
        options.style.display = "block";
        this.classList.add("active");
      }
    });

  citySelect.querySelectorAll(".option-item").forEach((option) => {
    option.removeEventListener("click", handleCitySelection);
    option.addEventListener("click", handleCitySelection);
  });
}

function handleCitySelection(e) {
  e.stopPropagation();
  const option = this;
  const wrapper = option.closest(".custom-select-wrapper");
  const trigger = wrapper.querySelector(".custom-select-trigger");
  const selectedSpan = trigger.querySelector(".selected-option");
  const options = wrapper.querySelector(".custom-select-options");
  const hiddenSelect = wrapper.parentElement?.querySelector("select");

  const value = option.dataset.value;
  const text = option.textContent.trim();

  selectedSpan.textContent = text;
  selectedSpan.classList.remove("placeholder");

  if (hiddenSelect) {
    hiddenSelect.value = value;
    hiddenSelect.dispatchEvent(new Event("change"));
  }

  const cityDisplay = document.getElementById("city");
  if (cityDisplay && value) {
    cityDisplay.textContent = text;
  }

  options
    .querySelectorAll(".option-item")
    .forEach((opt) => opt.classList.remove("selected"));
  option.classList.add("selected");
  options.style.display = "none";
  trigger.classList.remove("active");
}

function initializeStep3CityDropdown() {
  const citySelect = document.querySelector("#step3Modal #cityCustomSelect");
  if (!citySelect) {
    createCityDropdown();
    return;
  }
  setupCityDropdownHandlers();
}

function createCityDropdown() {
  const cityBlock = document.getElementsByClassName("cityAddressBlock");
  if (!cityBlock) return;

  if (document.querySelector("#step3Modal #cityCustomSelect")) return;

  const citySelectHTML = `
        <div>
            <div class="proprietor-gender-section">
                <label>City</label>
                <div class="custom-select-wrapper" id="cityCustomSelect">
                    <div class="custom-select-trigger">
                        <span class="selected-option">Select city</span>
                        <div class="select-right">
                            <i class="material-icons">expand_more</i>
                        </div>
                    </div>
                    <div class="custom-select-options" style="display: none">
                        <div class="option-item" data-value="">Select city</div>
                    </div>
                </div>
                <select style="display: none">
                    <option value="">Select city</option>
                </select>
            </div>
        </div>
    `;

  const stateDiv = cityBlock.querySelector("div:last-child");
  if (stateDiv) {
    const cityDiv = document.createElement("div");
    cityDiv.innerHTML = citySelectHTML;
    stateDiv.parentNode.insertBefore(cityDiv.firstElementChild, stateDiv);
  }

  cityBlock.style.gridTemplateColumns = "1fr 1fr";

  setTimeout(setupCityDropdownHandlers, 100);
}

$(document).ready(function () {
  setTimeout(initializeStep3CityDropdown, 500);

  $(document).on("click", "#step2NextBtn", function () {
    setTimeout(initializeStep3CityDropdown, 500);
    setTimeout(function () {
      const pincodeInput = document.querySelector(
        '#step3Modal input[placeholder="Enter pin code"]',
      );
      if (pincodeInput) {
        pincodeInput.value = "";
        document.getElementsByClassName("cityAddressBlock").style.display =
          "none";
        const citySelect = document.querySelector(
          "#step3Modal #cityCustomSelect",
        );
        if (citySelect) {
          const trigger = citySelect.querySelector(
            ".custom-select-trigger .selected-option",
          );
          if (trigger) {
            trigger.textContent = "Select city";
          }
        }
        const stateDisplay = document.getElementById("state");
        if (stateDisplay) {
          stateDisplay.textContent = "";
        }
        const cityDisplay = document.getElementById("city");
        if (cityDisplay) {
          cityDisplay.textContent = "";
        }
      }
    }, 100);

    $("#step2Modal").hide();
    disableSaveExitButton();

    $("#step3Modal").show();
  });
});

const originalCheckStep3Completion = checkStep3Completion;
checkStep3Completion = function () {
  originalCheckStep3Completion();

  const modal = document.getElementById("step3Modal");
  if (!modal) return;

  const nextBtn = document.getElementById("step3NextBtn");
  if (!nextBtn) return;

  const cityBlock = document.getElementsByClassName("cityAddressBlock");
  const cityDisplay = document.getElementById("city");
  const stateDisplay = document.getElementById("state");

  if (cityBlock && cityBlock.style.display !== "none") {
    const citySelect = document.querySelector("#step3Modal #cityCustomSelect");
    const selectedCity = citySelect
      ? citySelect.querySelector(".custom-select-trigger .selected-option")
          ?.textContent
      : "";

    const citySelected = selectedCity && selectedCity !== "Select city";
    const statePopulated =
      stateDisplay &&
      stateDisplay.textContent &&
      stateDisplay.textContent !== "Not found";

    if (!citySelected || !statePopulated) {
      nextBtn.disabled = true;
      nextBtn.style.background = "#D2D2D2";
      nextBtn.style.color = "#6F6F6F";
      nextBtn.style.cursor = "not-allowed";
      return false;
    }
  }

  return true;
};

$(document).ready(function () {
  setTimeout(initializeStep3CityDropdown, 100);

  $(document).on(
    "change",
    "#step3Modal #cityCustomSelect .option-item",
    function () {
      setTimeout(checkStep3Completion, 100);
    },
  );

  /* changes made on 10 aug */
  var $element = $(".character-limit");
  var textContent = $element.text().trim();
  var originalText = textContent;

  if (textContent.length > 110) {
    var truncatedText = textContent.substring(0, 110) + "...";
    $element.text(truncatedText);
  }

  if (originalText.length < 45) {
    $(".image-div").addClass("centered");
  }

  var $element2 = $(".character-limit-2");
  var textContent2 = $element2.text().trim();
  var originalText2 = textContent2;

  if (textContent2.length > 48) {
    var truncatedText = textContent2.substring(0, 48) + "...";
    $element2.text(truncatedText);
  }
});

$(".custom-modal-overlay, .esign-modal-overlay, .tour-overlay").on(
  "click",
  function (e) {
    if (e.target === this) {
      e.stopPropagation();
      return false;
    }
  },
);
