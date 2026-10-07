// Step 1
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

  const MODAL_SELECTOR = "#step1Modal";
  const MODAL_OVERLAY_SELECTOR = ".custom-modal-overlay";

  function initKeyboardNavigation() {
    $(document).on("click", "#applySanctionProceedBtn", function () {
      setTimeout(() => {
        if ($("#step1Modal").is(":visible")) {
          setupModalFocus();
        }
      }, 300);
    });

    $(document).on("click", ".journey-close", function () {
      const modal = $(this).closest(MODAL_OVERLAY_SELECTOR);
      if (modal.is(":visible")) {
        modal.hide();
        if (lastFocusedElement) {
          $(lastFocusedElement).focus();
        }
      }
    });

    $(document).on("keydown", MODAL_SELECTOR, function (e) {
      if (!$(this).is(":visible")) return;

      if (e.key === "Tab") {
        handleTabNavigation(e);
      } else if (e.key === "Enter" || e.key === " ") {
        handleEnterNavigation(e);
      } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        handleArrowNavigation(e);
      }
    });

    $(document).on("DOMSubtreeModified", MODAL_SELECTOR, function () {
      if ($(this).is(":visible") && !isModalOpen) {
        isModalOpen = true;
        setupModalFocus();
      } else if (!$(this).is(":visible")) {
        isModalOpen = false;
      }
    });

    $(document).on("focusin", MODAL_SELECTOR, function (e) {
      if (!$(this).is(":visible")) return;
      const target = e.target;
      if (!isFocusableElement(target)) {
        setTimeout(() => {
          if (
            focusableElements.length > 0 &&
            currentFocusIndex < focusableElements.length
          ) {
            $(focusableElements[currentFocusIndex]).focus();
          }
        }, 10);
      }
    });
  }

  function setupModalFocus() {
    const modal = $(MODAL_SELECTOR);
    if (!modal.is(":visible")) return;

    focusableElements = getFocusableElements(modal);

    if (focusableElements.length === 0) return;

    const verifyBtn = modal.find(".verify-link").first();
    if (verifyBtn.length && verifyBtn.is(":visible")) {
      currentFocusIndex = focusableElements.indexOf(verifyBtn[0]);
      if (currentFocusIndex === -1) {
        currentFocusIndex = 0;
      }
      $(focusableElements[currentFocusIndex]).focus();
    } else {
      currentFocusIndex = 0;
      $(focusableElements[currentFocusIndex]).focus();
    }

    lastFocusedElement = document.activeElement;
  }

  function getFocusableElements(modal) {
    const elements = [];

    modal.find(FOCUSABLE_ELEMENTS.join(",")).each(function () {
      const $el = $(this);
      if ($el.is(":visible") && !$el.prop("disabled")) {
        if ($el.hasClass("custom-select-trigger")) {
          if (
            $el
              .closest(".custom-select-wrapper")
              .find(".custom-select-options")
              .is(":visible")
          ) {
            elements.push(this);
          }
        } else {
          elements.push(this);
        }
      }
    });

    return [...new Set(elements)];
  }

  function isFocusableElement(element) {
    if (!element) return false;
    const $el = $(element);
    return (
      $el.is(":visible") &&
      !$el.prop("disabled") &&
      (element.matches(FOCUSABLE_ELEMENTS.join(",")) ||
        element.matches('[tabindex]:not([tabindex="-1"])'))
    );
  }

  function handleTabNavigation(e) {
    const modal = $(MODAL_SELECTOR);
    if (!modal.is(":visible")) return;

    focusableElements = getFocusableElements(modal);

    if (focusableElements.length === 0) return;

    const isShiftPressed = e.shiftKey;
    const currentElement = document.activeElement;

    currentFocusIndex = focusableElements.indexOf(currentElement);
    if (currentFocusIndex === -1) {
      currentFocusIndex = isShiftPressed ? focusableElements.length - 1 : 0;
    }

    e.preventDefault();

    if (isShiftPressed) {
      currentFocusIndex =
        (currentFocusIndex - 1 + focusableElements.length) %
        focusableElements.length;
    } else {
      if (
        !isShiftPressed &&
        currentFocusIndex === focusableElements.length - 1
      ) {
        const verifyIndex = focusableElements.findIndex((el) =>
          $(el).hasClass("verify-link"),
        );

        currentFocusIndex = verifyIndex !== -1 ? verifyIndex : 0;
      } else if (isShiftPressed) {
        currentFocusIndex =
          (currentFocusIndex - 1 + focusableElements.length) %
          focusableElements.length;
      } else {
        currentFocusIndex++;
      }
    }

    const nextElement = focusableElements[currentFocusIndex];
    if (nextElement) {
      $(nextElement).focus();

      handleElementFocus(nextElement);
    }
  }

  function handleEnterNavigation(e) {
    const target = document.activeElement;
    if (!target) return;

    const $target = $(target);

    if ($target.hasClass("verify-link")) {
      e.preventDefault();
      $target.click();
      return;
    }

    if ($target.closest(".switch").length) {
      e.preventDefault();
      $target.closest(".switch").find("input").click();
      return;
    }

    if ($target.hasClass("custom-select-trigger")) {
      e.preventDefault();
      $target.click();
      return;
    }

    if ($target.closest(".option-item").length) {
      e.preventDefault();
      $target.click();
      return;
    }

    if (
      $target.hasClass("upload-drop-zone") ||
      $target.closest(".upload-drop-zone").length
    ) {
      e.preventDefault();
      const zone = $target.hasClass("upload-drop-zone")
        ? $target
        : $target.closest(".upload-drop-zone");
      zone.find(".upload-file-input").click();
      return;
    }

    if ($target.hasClass("save-bank-btn") || $target.hasClass("reset-bank")) {
      e.preventDefault();
      $target.click();
      return;
    }

    if ($target.is("button") || $target.closest("button").length) {
      e.preventDefault();
      const btn = $target.is("button") ? $target : $target.closest("button");
      btn.click();
    }
  }

  function handleArrowNavigation(e) {
    const target = document.activeElement;
    if (!target) return;

    const $target = $(target);
    const isDropdownOpen = $target
      .closest(".custom-select-wrapper")
      .find(".custom-select-options")
      .is(":visible");

    if (isDropdownOpen) {
      e.preventDefault();
      const options = $target
        .closest(".custom-select-wrapper")
        .find(".option-item:visible");
      if (options.length === 0) return;

      const currentOption = target.closest(".option-item");
      let currentIndex = options.index(currentOption);

      if (e.key === "ArrowDown") {
        currentIndex = (currentIndex + 1) % options.length;
      } else if (e.key === "ArrowUp") {
        currentIndex = (currentIndex - 1 + options.length) % options.length;
      }

      options.removeClass("active");
      $(options[currentIndex]).addClass("active").focus();
    }
  }

  function handleElementFocus(element) {
    $(".keyboard-focus").removeClass("keyboard-focus");

    const $element = $(element);

    if ($element.is("#incorporationDate")) {
      $element.closest(".date-input").addClass("keyboard-focus");
    } else if ($element.closest(".username").length) {
      $element
        .closest(".username")
        .find(".text-input")
        .addClass("keyboard-focus");
    } else if ($element.closest(".urc-grid").length) {
      $element
        .closest(".urc-grid")
        .find(".text-input")
        .addClass("keyboard-focus");
    } else if ($element.closest(".otp-inputs").length) {
    } else if ($element.closest(".switch").length) {
      $element.closest(".switch").addClass("keyboard-focus");
    } else if ($element.is("button")) {
      $element.addClass("keyboard-focus");
    } else {
      $element.addClass("keyboard-focus");
    }

    if ($element.hasClass("custom-select-trigger")) {
      const wrapper = $element.closest(".custom-select-wrapper");
      const options = wrapper.find(".custom-select-options");

      if (!options.is(":visible")) {
        $element.click();
      }
    }

    if (element.getBoundingClientRect) {
      const rect = element.getBoundingClientRect();
      const modalRect = document
        .querySelector(MODAL_SELECTOR)
        .getBoundingClientRect();

      if (
        rect.top < modalRect.top + 50 ||
        rect.bottom > modalRect.bottom - 50
      ) {
        element.scrollIntoView({
          block: "center",
          behavior: "smooth",
        });
      }
    }
  }

  $(document).ready(function () {
    initKeyboardNavigation();

    $(document).on(
      "click",
      ".verify-link, .custom-select-trigger, .switch input, .otp-inputs input",
      function () {
        const modal = $(MODAL_SELECTOR);
        if (modal.is(":visible")) {
          focusableElements = getFocusableElements(modal);
        }
      },
    );
  });

  window.modalKeyboard = {
    getFocusableElements,
    setCurrentFocus: (index) => {
      if (focusableElements[index]) {
        $(focusableElements[index]).focus();
      }
    },
    refreshFocusList: () => {
      const modal = $(MODAL_SELECTOR);
      if (modal.is(":visible")) {
        focusableElements = getFocusableElements(modal);
      }
    },
  };
})();

// Step 2
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

  const MODAL_SELECTOR = "#step2Modal";
  const MODAL_OVERLAY_SELECTOR = ".custom-modal-overlay";

  function initKeyboardNavigation() {
    $(document).on("click", "#step1NextBtn", function () {
      setTimeout(() => {
        if ($("#step2Modal").is(":visible")) {
          setupModalFocus();
        }
      }, 300);
    });

    $(document).on("click", "#cancelStep2Btn", function () {
      const modal = $(this).closest(MODAL_OVERLAY_SELECTOR);
      if (modal.is(":visible")) {
        modal.hide();
        if (lastFocusedElement) {
          $(lastFocusedElement).focus();
        }
      }
    });

    $(document).on("click", "#saveExitBtnStep2", function () {
      console.log("Save & Exit clicked");
      const modal = $(this).closest(MODAL_OVERLAY_SELECTOR);
      if (modal.is(":visible")) {
        modal.hide();
        if (lastFocusedElement) {
          $(lastFocusedElement).focus();
        }
      }
    });

    $(document).on("click", ".journey-close", function () {
      const modal = $(this).closest(MODAL_OVERLAY_SELECTOR);
      if (modal.is(":visible")) {
        modal.hide();
        if (lastFocusedElement) {
          $(lastFocusedElement).focus();
        }
      }
    });

    $(document).on("keydown", MODAL_SELECTOR, function (e) {
      if (!$(this).is(":visible")) return;

      if (e.key === "Tab") {
        handleTabNavigation(e);
      } else if (e.key === "Enter" || e.key === " ") {
        handleEnterNavigation(e);
      } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        handleArrowNavigation(e);
      } else if (e.key === "Escape") {
        handleEscapeNavigation(e);
      }
    });

    $(document).on("click", "#step2NextBtn", function () {});

    $(document).on("DOMSubtreeModified", MODAL_SELECTOR, function () {
      if ($(this).is(":visible") && !isModalOpen) {
        isModalOpen = true;
        setupModalFocus();
      } else if (!$(this).is(":visible")) {
        isModalOpen = false;
      }
    });

    $(document).on("focusin", MODAL_SELECTOR, function (e) {
      if (!$(this).is(":visible")) return;
      const target = e.target;
      if (!isFocusableElement(target)) {
        setTimeout(() => {
          if (
            focusableElements.length > 0 &&
            currentFocusIndex < focusableElements.length
          ) {
            $(focusableElements[currentFocusIndex]).focus();
          }
        }, 10);
      }
    });
  }

  function setupModalFocus() {
    const modal = $(MODAL_SELECTOR);
    if (!modal.is(":visible")) return;

    focusableElements = getFocusableElements(modal);

    if (focusableElements.length === 0) return;

    currentFocusIndex = 0;
    $(focusableElements[currentFocusIndex]).focus();

    lastFocusedElement = document.activeElement;
  }

  function getFocusableElements(modal) {
    const elements = [];

    modal.find(FOCUSABLE_ELEMENTS.join(",")).each(function () {
      const $el = $(this);
      if ($el.is(":visible") && !$el.prop("disabled")) {
        if ($el.hasClass("custom-select-trigger")) {
          if (
            $el
              .closest(".custom-select-wrapper")
              .find(".custom-select-options")
              .is(":visible")
          ) {
            elements.push(this);
          }
        } else {
          elements.push(this);
        }
      }
    });

    const saveExitIndex = elements.findIndex(
      (el) =>
        $(el).attr("id") === "saveExitBtnStep2" ||
        ($(el).closest(".modal-footer").length && $(el).is("p")),
    );

    if (saveExitIndex !== -1 && saveExitIndex !== elements.length - 1) {
      const saveExitElement = elements.splice(saveExitIndex, 1)[0];
      elements.push(saveExitElement);
    }

    return [...new Set(elements)];
  }

  function isFocusableElement(element) {
    if (!element) return false;
    const $el = $(element);
    return (
      $el.is(":visible") &&
      !$el.prop("disabled") &&
      (element.matches(FOCUSABLE_ELEMENTS.join(",")) ||
        element.matches('[tabindex]:not([tabindex="-1"])') ||
        ($(element).closest(".modal-footer").length && $(element).is("p")))
    );
  }

  function handleTabNavigation(e) {
    const modal = $(MODAL_SELECTOR);
    if (!modal.is(":visible")) return;

    focusableElements = getFocusableElements(modal);

    if (focusableElements.length === 0) return;

    const isShiftPressed = e.shiftKey;
    const currentElement = document.activeElement;

    currentFocusIndex = focusableElements.indexOf(currentElement);
    if (currentFocusIndex === -1) {
      currentFocusIndex = isShiftPressed ? focusableElements.length - 1 : 0;
    }

    e.preventDefault();

    if (isShiftPressed) {
      currentFocusIndex =
        (currentFocusIndex - 1 + focusableElements.length) %
        focusableElements.length;
    } else {
      const nextIndex = (currentFocusIndex + 1) % focusableElements.length;

      const nextElement = focusableElements[nextIndex];
      const isSaveExit =
        $(nextElement).attr("id") === "saveExitBtnStep2" ||
        ($(nextElement).closest(".modal-footer").length &&
          $(nextElement).is("p"));

      currentFocusIndex = nextIndex;
    }

    const nextElement = focusableElements[currentFocusIndex];
    if (nextElement) {
      $(nextElement).focus();
      handleElementFocus(nextElement);
    }
  }

  function handleEnterNavigation(e) {
    const target = document.activeElement;
    if (!target) return;

    const $target = $(target);

    if (
      $target.attr("id") === "saveExitBtnStep2" ||
      ($target.closest(".modal-footer").length && $target.is("p"))
    ) {
      e.preventDefault();
      $target.click();
      return;
    }

    if ($target.closest(".switch").length) {
      e.preventDefault();
      const $switch = $target.closest(".switch");
      const checkbox = $switch.find("input[type='checkbox']");
      if (checkbox.length) {
        checkbox.prop("checked", !checkbox.prop("checked")).trigger("change");
      }
      return;
    }

    if ($target.hasClass("custom-select-trigger")) {
      e.preventDefault();
      $target.click();
      return;
    }

    if ($target.closest(".option-item").length) {
      e.preventDefault();
      $target.click();
      return;
    }

    if (
      $target.hasClass("upload-drop-zone") ||
      $target.closest(".upload-drop-zone").length
    ) {
      e.preventDefault();
      const zone = $target.hasClass("upload-drop-zone")
        ? $target
        : $target.closest(".upload-drop-zone");
      zone.find(".upload-file-input").click();
      return;
    }

    if ($target.is("button") || $target.closest("button").length) {
      e.preventDefault();
      const btn = $target.is("button") ? $target : $target.closest("button");
      btn.click();
    }

    if ($target.closest(".verify-link").length) {
      e.preventDefault();
      $target.closest(".verify-link").click();
    }
  }

  function handleArrowNavigation(e) {
    const target = document.activeElement;
    if (!target) return;

    const $target = $(target);
    const isDropdownOpen = $target
      .closest(".custom-select-wrapper")
      .find(".custom-select-options")
      .is(":visible");

    if (isDropdownOpen) {
      e.preventDefault();
      const options = $target
        .closest(".custom-select-wrapper")
        .find(".option-item:visible");
      if (options.length === 0) return;

      const currentOption = target.closest(".option-item");
      let currentIndex = options.index(currentOption);

      if (e.key === "ArrowDown") {
        currentIndex = (currentIndex + 1) % options.length;
      } else if (e.key === "ArrowUp") {
        currentIndex = (currentIndex - 1 + options.length) % options.length;
      }

      options.removeClass("active");
      $(options[currentIndex]).addClass("active").focus();
    }
  }

  function handleEscapeNavigation(e) {
    const modal = $(MODAL_SELECTOR);
    if (modal.is(":visible")) {
      modal.hide();
      if (lastFocusedElement) {
        $(lastFocusedElement).focus();
      }
    }
  }

  function handleElementFocus(element) {
    $(".keyboard-focus").removeClass("keyboard-focus");
    $(".lei-input-wrapper").removeClass("keyboard-focus");
    $(".input-wrapper").removeClass("keyboard-focus");

    const $element = $(element);

    if (
      $element.attr("id") === "saveExitBtnStep2" ||
      ($element.closest(".modal-footer").length && $element.is("p"))
    ) {
      $element.addClass("keyboard-focus");
    } else if ($element.closest(".lei-input-wrapper").length) {
      $element.closest(".lei-input-wrapper").addClass("keyboard-focus");
    } else if ($element.closest(".input-wrapper").length) {
      $element.closest(".input-wrapper").addClass("keyboard-focus");
    } else if ($element.is("#idProofNumber")) {
      $element.addClass("keyboard-focus");
    } else if ($element.is("button") || $element.closest("button").length) {
      const btn = $element.is("button") ? $element : $element.closest("button");
      btn.addClass("keyboard-focus");
    } else if ($element.closest(".switch").length) {
      $element.closest(".switch").addClass("keyboard-focus");
    } else if ($element.hasClass("custom-select-trigger")) {
      $element.addClass("keyboard-focus");
    } else if (
      $element.hasClass("upload-drop-zone") ||
      $element.closest(".upload-drop-zone").length
    ) {
      const zone = $element.hasClass("upload-drop-zone")
        ? $element
        : $element.closest(".upload-drop-zone");
      zone.addClass("keyboard-focus");
    } else if ($element.is("input, select, textarea")) {
      $element.addClass("keyboard-focus");
    } else {
      $element.addClass("keyboard-focus");
    }

    if ($element.hasClass("custom-select-trigger")) {
      const wrapper = $element.closest(".custom-select-wrapper");
      const options = wrapper.find(".custom-select-options");

      if (!options.is(":visible")) {
        $element.click();
      }
    }

    if (element.getBoundingClientRect) {
      const rect = element.getBoundingClientRect();
      const modalRect = document
        .querySelector(MODAL_SELECTOR)
        .getBoundingClientRect();

      if (
        rect.top < modalRect.top + 50 ||
        rect.bottom > modalRect.bottom - 50
      ) {
        element.scrollIntoView({
          block: "center",
          behavior: "smooth",
        });
      }
    }
  }

  $(document).ready(function () {
    initKeyboardNavigation();

    const saveExitBtn = document.getElementById("saveExitBtnStep2");
    if (saveExitBtn && !saveExitBtn.hasAttribute("tabindex")) {
      saveExitBtn.setAttribute("tabindex", "0");
      saveExitBtn.setAttribute("role", "button");
    }

    $(document).on(
      "click",
      ".switch input, .custom-select-trigger, .upload-drop-zone",
      function () {
        const modal = $(MODAL_SELECTOR);
        if (modal.is(":visible")) {
          setTimeout(() => {
            focusableElements = getFocusableElements(modal);
          }, 100);
        }
      },
    );
  });

  window.modalKeyboard = {
    getFocusableElements,
    setCurrentFocus: (index) => {
      if (focusableElements[index]) {
        $(focusableElements[index]).focus();
      }
    },
    refreshFocusList: () => {
      const modal = $(MODAL_SELECTOR);
      if (modal.is(":visible")) {
        focusableElements = getFocusableElements(modal);
      }
    },
  };
})();

// Step 3
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

  const MODAL_SELECTOR = "#step3Modal";
  const MODAL_OVERLAY_SELECTOR = ".custom-modal-overlay";

  function initKeyboardNavigation() {
    $(document).on("click", "#step2NextBtn", function () {
      setTimeout(() => {
        if ($("#step3Modal").is(":visible")) {
          setupModalFocus();
        }
      }, 300);
    });

    $(document).on("click", "#cancelStep3Btn", function () {
      const modal = $(this).closest(MODAL_OVERLAY_SELECTOR);
      if (modal.is(":visible")) {
        modal.hide();
        if (lastFocusedElement) {
          $(lastFocusedElement).focus();
        }
      }
    });

    $(document).on("click", "#saveExitBtnStep3", function () {
      console.log("Save & Exit clicked for Step 3");
      const modal = $(this).closest(MODAL_OVERLAY_SELECTOR);
      if (modal.is(":visible")) {
        modal.hide();
        if (lastFocusedElement) {
          $(lastFocusedElement).focus();
        }
      }
    });

    $(document).on("click", ".journey-close", function () {
      const modal = $(this).closest(MODAL_OVERLAY_SELECTOR);
      if (modal.is(":visible")) {
        modal.hide();
        if (lastFocusedElement) {
          $(lastFocusedElement).focus();
        }
      }
    });

    $(document).on("keydown", MODAL_SELECTOR, function (e) {
      if (!$(this).is(":visible")) return;

      if (e.key === "Tab") {
        handleTabNavigation(e);
      } else if (e.key === "Enter" || e.key === " ") {
        handleEnterNavigation(e);
      } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        handleArrowNavigation(e);
      } else if (e.key === "Escape") {
        handleEscapeNavigation(e);
      }
    });

    $(document).on("click", "#step3NextBtn", function () {
      console.log("Step 3 Next clicked");
    });

    $(document).on("DOMSubtreeModified", MODAL_SELECTOR, function () {
      if ($(this).is(":visible") && !isModalOpen) {
        isModalOpen = true;
        setupModalFocus();
      } else if (!$(this).is(":visible")) {
        isModalOpen = false;
      }
    });

    $(document).on("focusin", MODAL_SELECTOR, function (e) {
      if (!$(this).is(":visible")) return;
      const target = e.target;
      if (!isFocusableElement(target)) {
        setTimeout(() => {
          if (
            focusableElements.length > 0 &&
            currentFocusIndex < focusableElements.length
          ) {
            $(focusableElements[currentFocusIndex]).focus();
          }
        }, 10);
      }
    });
  }

  function setupModalFocus() {
    const modal = $(MODAL_SELECTOR);
    if (!modal.is(":visible")) return;

    focusableElements = getFocusableElements(modal);

    if (focusableElements.length === 0) return;

    currentFocusIndex = 0;
    $(focusableElements[currentFocusIndex]).focus();

    lastFocusedElement = document.activeElement;
  }

  function getFocusableElements(modal) {
    const elements = [];

    modal.find(FOCUSABLE_ELEMENTS.join(",")).each(function () {
      const $el = $(this);
      if ($el.is(":visible") && !$el.prop("disabled")) {
        if ($el.hasClass("custom-select-trigger")) {
          if (
            $el
              .closest(".custom-select-wrapper")
              .find(".custom-select-options")
              .is(":visible")
          ) {
            elements.push(this);
          }
        } else {
          elements.push(this);
        }
      }
    });

    const saveExitIndex = elements.findIndex(
      (el) =>
        $(el).attr("id") === "saveExitBtnStep3" ||
        ($(el).closest(".modal-footer").length && $(el).is("p")),
    );

    if (saveExitIndex !== -1 && saveExitIndex !== elements.length - 1) {
      const saveExitElement = elements.splice(saveExitIndex, 1)[0];
      elements.push(saveExitElement);
    }

    return [...new Set(elements)];
  }

  function isFocusableElement(element) {
    if (!element) return false;
    const $el = $(element);
    return (
      $el.is(":visible") &&
      !$el.prop("disabled") &&
      (element.matches(FOCUSABLE_ELEMENTS.join(",")) ||
        element.matches('[tabindex]:not([tabindex="-1"])') ||
        ($(element).closest(".modal-footer").length && $(element).is("p")))
    );
  }

  function handleTabNavigation(e) {
    const modal = $(MODAL_SELECTOR);
    if (!modal.is(":visible")) return;

    focusableElements = getFocusableElements(modal);

    if (focusableElements.length === 0) return;

    const isShiftPressed = e.shiftKey;
    const currentElement = document.activeElement;

    currentFocusIndex = focusableElements.indexOf(currentElement);
    if (currentFocusIndex === -1) {
      currentFocusIndex = isShiftPressed ? focusableElements.length - 1 : 0;
    }

    e.preventDefault();

    if (isShiftPressed) {
      currentFocusIndex =
        (currentFocusIndex - 1 + focusableElements.length) %
        focusableElements.length;
    } else {
      const nextIndex = (currentFocusIndex + 1) % focusableElements.length;

      const nextElement = focusableElements[nextIndex];
      const isSaveExit =
        $(nextElement).attr("id") === "saveExitBtnStep3" ||
        ($(nextElement).closest(".modal-footer").length &&
          $(nextElement).is("p"));

      currentFocusIndex = nextIndex;
    }

    const nextElement = focusableElements[currentFocusIndex];
    if (nextElement) {
      $(nextElement).focus();
      handleElementFocus(nextElement);
    }
  }

  function handleEnterNavigation(e) {
    const target = document.activeElement;
    if (!target) return;

    const $target = $(target);

    if (
      $target.attr("id") === "saveExitBtnStep3" ||
      ($target.closest(".modal-footer").length && $target.is("p"))
    ) {
      e.preventDefault();
      $target.click();
      return;
    }

    if ($target.hasClass("custom-select-trigger")) {
      e.preventDefault();
      $target.click();
      return;
    }

    if ($target.closest(".option-item").length) {
      e.preventDefault();
      $target.click();
      return;
    }

    if ($target.is("button") || $target.closest("button").length) {
      e.preventDefault();
      const btn = $target.is("button") ? $target : $target.closest("button");
      btn.click();
      return;
    }

    if ($target.is("input")) {
      if ($target.attr("type") === "date") {
        $target.showPicker ? $target.showPicker() : $target.click();
      }
    }
  }

  function handleArrowNavigation(e) {
    const target = document.activeElement;
    if (!target) return;

    const $target = $(target);
    const isDropdownOpen = $target
      .closest(".custom-select-wrapper")
      .find(".custom-select-options")
      .is(":visible");

    if (isDropdownOpen) {
      e.preventDefault();
      const options = $target
        .closest(".custom-select-wrapper")
        .find(".option-item:visible");
      if (options.length === 0) return;

      const currentOption = target.closest(".option-item");
      let currentIndex = options.index(currentOption);

      if (e.key === "ArrowDown") {
        currentIndex = (currentIndex + 1) % options.length;
      } else if (e.key === "ArrowUp") {
        currentIndex = (currentIndex - 1 + options.length) % options.length;
      }

      options.removeClass("active");
      $(options[currentIndex]).addClass("active").focus();
    }
  }

  function handleEscapeNavigation(e) {
    const modal = $(MODAL_SELECTOR);
    if (modal.is(":visible")) {
      modal.hide();
      if (lastFocusedElement) {
        $(lastFocusedElement).focus();
      }
    }
  }

  function handleElementFocus(element) {
    $(".keyboard-focus").removeClass("keyboard-focus");
    $(".field-wrapper input").removeClass("keyboard-focus");

    const $element = $(element);

    if (
      $element.attr("id") === "saveExitBtnStep3" ||
      ($element.closest(".modal-footer").length && $element.is("p"))
    ) {
      $element.addClass("keyboard-focus");
    } else if ($element.closest(".field-wrapper input").length) {
      $element.closest(".field-wrapper input").addClass("keyboard-focus");
      if ($element.is("input, select, textarea")) {
        $element.addClass("keyboard-focus");
      }
    } else if ($element.hasClass("custom-select-trigger")) {
      $element.addClass("keyboard-focus");
    } else if ($element.is("button") || $element.closest("button").length) {
      const btn = $element.is("button") ? $element : $element.closest("button");
      btn.addClass("keyboard-focus");
    } else if ($element.closest(".date-input").length) {
      $element.closest(".date-input").addClass("keyboard-focus");
      $element.addClass("keyboard-focus");
    } else if ($element.is("input, select, textarea")) {
      $element.addClass("keyboard-focus");
    } else {
      $element.addClass("keyboard-focus");
    }

    if ($element.hasClass("custom-select-trigger")) {
      const wrapper = $element.closest(".custom-select-wrapper");
      const options = wrapper.find(".custom-select-options");

      if (!options.is(":visible")) {
        $element.click();
      }
    }

    if (element.getBoundingClientRect) {
      const rect = element.getBoundingClientRect();
      const modalRect = document
        .querySelector(MODAL_SELECTOR)
        .getBoundingClientRect();

      if (
        rect.top < modalRect.top + 50 ||
        rect.bottom > modalRect.bottom - 50
      ) {
        element.scrollIntoView({
          block: "center",
          behavior: "smooth",
        });
      }
    }
  }

  $(document).ready(function () {
    initKeyboardNavigation();

    const saveExitBtn = document.getElementById("saveExitBtnStep3");
    if (!saveExitBtn) {
      const footerP = document.querySelector("#step3Modal .modal-footer p");
      if (footerP) {
        footerP.id = "saveExitBtnStep3";
        footerP.setAttribute("tabindex", "0");
        footerP.setAttribute("role", "button");
      }
    } else {
      if (!saveExitBtn.hasAttribute("tabindex")) {
        saveExitBtn.setAttribute("tabindex", "0");
        saveExitBtn.setAttribute("role", "button");
      }
    }

    $(document).on(
      "click",
      ".custom-select-trigger, .date-input input",
      function () {
        const modal = $(MODAL_SELECTOR);
        if (modal.is(":visible")) {
          setTimeout(() => {
            focusableElements = getFocusableElements(modal);
          }, 100);
        }
      },
    );

    $(document).on("DOMSubtreeModified", ".custom-select-options", function () {
      const modal = $(MODAL_SELECTOR);
      if (modal.is(":visible")) {
        setTimeout(() => {
          focusableElements = getFocusableElements(modal);
        }, 100);
      }
    });
  });

  window.modalKeyboardStep3 = {
    getFocusableElements,
    setCurrentFocus: (index) => {
      if (focusableElements[index]) {
        $(focusableElements[index]).focus();
      }
    },
    refreshFocusList: () => {
      const modal = $(MODAL_SELECTOR);
      if (modal.is(":visible")) {
        focusableElements = getFocusableElements(modal);
      }
    },
  };
})();

// Step 4
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
    ".add-bank-link",
    'input[type="radio"]',
    'input[type="checkbox"]',
  ];

  let isModalOpen = false;
  let currentFocusIndex = 0;
  let focusableElements = [];
  let lastFocusedElement = null;

  const MODAL_SELECTOR = "#step4Modal";
  const MODAL_OVERLAY_SELECTOR = ".custom-modal-overlay";

  function initKeyboardNavigation() {
    $(document).on("click", "#step3NextBtn", function () {
      setTimeout(() => {
        if ($("#step4Modal").is(":visible")) {
          setupModalFocus();
        }
      }, 300);
    });

    $(document).on("click", "#step4BackBtn", function () {
      const modal = $(this).closest(MODAL_OVERLAY_SELECTOR);
      if (modal.is(":visible")) {
        modal.hide();
        if (lastFocusedElement) {
          $(lastFocusedElement).focus();
        }
      }
    });

    $(document).on("click", "#Step4saveExitBtn", function (e) {
      e.preventDefault();
      console.log("Save & Exit clicked for Step 4");
      const modal = $(this).closest(MODAL_OVERLAY_SELECTOR);
      if (modal.is(":visible")) {
        modal.hide();
        if (lastFocusedElement) {
          $(lastFocusedElement).focus();
        }
      }
    });

    $(document).on("click", ".journey-close", function () {
      const modal = $(this).closest(MODAL_OVERLAY_SELECTOR);
      if (modal.is(":visible")) {
        modal.hide();
        if (lastFocusedElement) {
          $(lastFocusedElement).focus();
        }
      }
    });

    $(document).on("click", "#addBankAccount", function () {
      console.log("Add bank account clicked");
      setTimeout(() => {
        focusableElements = getFocusableElements($(MODAL_SELECTOR));
      }, 100);
    });

    $(document).on("change", 'input[name="bankMode"]', function () {
      setTimeout(() => {
        focusableElements = getFocusableElements($(MODAL_SELECTOR));
      }, 100);
    });

    $(document).on("change", 'input[name="itrMode"]', function () {
      setTimeout(() => {
        focusableElements = getFocusableElements($(MODAL_SELECTOR));
      }, 100);
    });

    $(document).on("keydown", MODAL_SELECTOR, function (e) {
      if (!$(this).is(":visible")) return;

      if (e.key === "Tab") {
        handleTabNavigation(e);
      } else if (e.key === "Enter" || e.key === " ") {
        handleEnterNavigation(e);
      } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        handleArrowNavigation(e);
      } else if (e.key === "Escape") {
        handleEscapeNavigation(e);
      }
    });

    $(document).on("click", "#step4NextBtn", function () {
      if (!$(this).prop("disabled")) {
        console.log("Step 4 Proceed clicked");
      }
    });

    $(document).on("DOMSubtreeModified", MODAL_SELECTOR, function () {
      if ($(this).is(":visible") && !isModalOpen) {
        isModalOpen = true;
        setupModalFocus();
      } else if (!$(this).is(":visible")) {
        isModalOpen = false;
      }
    });

    $(document).on("focusin", MODAL_SELECTOR, function (e) {
      if (!$(this).is(":visible")) return;
      const target = e.target;
      if (!isFocusableElement(target)) {
        setTimeout(() => {
          if (
            focusableElements.length > 0 &&
            currentFocusIndex < focusableElements.length
          ) {
            $(focusableElements[currentFocusIndex]).focus();
          }
        }, 10);
      }
    });
  }

  function setupModalFocus() {
    const modal = $(MODAL_SELECTOR);
    if (!modal.is(":visible")) return;

    focusableElements = getFocusableElements(modal);

    if (focusableElements.length === 0) return;

    currentFocusIndex = 0;
    $(focusableElements[currentFocusIndex]).focus();

    lastFocusedElement = document.activeElement;
  }

  function getFocusableElements(modal) {
    const elements = [];

    modal.find(FOCUSABLE_ELEMENTS.join(",")).each(function () {
      const $el = $(this);
      if ($el.is(":visible") && !$el.prop("disabled")) {
        if ($el.hasClass("custom-select-trigger")) {
          if (
            $el
              .closest(".custom-select-wrapper")
              .find(".custom-select-options")
              .is(":visible")
          ) {
            elements.push(this);
          }
        } else {
          elements.push(this);
        }
      }
    });

    const saveExitIndex = elements.findIndex(
      (el) =>
        $(el).attr("id") === "Step4saveExitBtn" ||
        ($(el).closest(".modal-footer").length && $(el).is("a")),
    );

    if (saveExitIndex !== -1 && saveExitIndex !== elements.length - 1) {
      const saveExitElement = elements.splice(saveExitIndex, 1)[0];
      elements.push(saveExitElement);
    }

    const addBankIndex = elements.findIndex(
      (el) =>
        $(el).attr("id") === "addBankAccount" ||
        $(el).hasClass("add-bank-link"),
    );

    if (addBankIndex !== -1 && addBankIndex < elements.length - 1) {
      const addBankElement = elements.splice(addBankIndex, 1)[0];
      elements.splice(elements.length - 1, 0, addBankElement);
    }

    return [...new Set(elements)];
  }

  function isFocusableElement(element) {
    if (!element) return false;
    const $el = $(element);
    return (
      $el.is(":visible") &&
      !$el.prop("disabled") &&
      (element.matches(FOCUSABLE_ELEMENTS.join(",")) ||
        element.matches('[tabindex]:not([tabindex="-1"])') ||
        ($(element).closest(".modal-footer").length && $(element).is("a")) ||
        $(element).hasClass("add-bank-link"))
    );
  }

  function handleTabNavigation(e) {
    const modal = $(MODAL_SELECTOR);
    if (!modal.is(":visible")) return;

    focusableElements = getFocusableElements(modal);

    if (focusableElements.length === 0) return;

    const isShiftPressed = e.shiftKey;
    const currentElement = document.activeElement;

    currentFocusIndex = focusableElements.indexOf(currentElement);
    if (currentFocusIndex === -1) {
      currentFocusIndex = isShiftPressed ? focusableElements.length - 1 : 0;
    }

    e.preventDefault();

    if (isShiftPressed) {
      currentFocusIndex =
        (currentFocusIndex - 1 + focusableElements.length) %
        focusableElements.length;
    } else {
      currentFocusIndex = (currentFocusIndex + 1) % focusableElements.length;
    }

    const nextElement = focusableElements[currentFocusIndex];
    if (nextElement) {
      $(nextElement).focus();
      handleElementFocus(nextElement);
    }
  }

  function handleEnterNavigation(e) {
    const target = document.activeElement;
    if (!target) return;

    const $target = $(target);

    if (
      $target.attr("id") === "Step4saveExitBtn" ||
      ($target.closest(".modal-footer").length && $target.is("a"))
    ) {
      e.preventDefault();
      $target.click();
      return;
    }

    if (
      $target.attr("id") === "addBankAccount" ||
      $target.hasClass("add-bank-link")
    ) {
      e.preventDefault();
      $target.click();
      return;
    }

    if ($target.is('input[type="radio"]')) {
      e.preventDefault();
      $target.prop("checked", true).trigger("change");
      return;
    }

    if ($target.is('input[type="checkbox"]')) {
      e.preventDefault();
      $target.prop("checked", !$target.prop("checked")).trigger("change");
      return;
    }

    if (
      $target.hasClass("upload-drop-zone") ||
      $target.closest(".upload-drop-zone").length
    ) {
      e.preventDefault();
      const zone = $target.hasClass("upload-drop-zone")
        ? $target
        : $target.closest(".upload-drop-zone");
      zone.find(".upload-file-input").click();
      return;
    }

    if ($target.is("button") || $target.closest("button").length) {
      e.preventDefault();
      const btn = $target.is("button") ? $target : $target.closest("button");
      btn.click();
      return;
    }

    if ($target.closest("#addBankAccount").length) {
      e.preventDefault();
      $target.closest("#addBankAccount").click();
      return;
    }
  }

  function handleArrowNavigation(e) {
    const target = document.activeElement;
    if (!target) return;

    const $target = $(target);

    if ($target.is('input[type="radio"]')) {
      e.preventDefault();
      const radioGroup = $target.closest(".radio-group");
      const radios = radioGroup.find('input[type="radio"]:visible');
      const currentIndex = radios.index($target);

      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        const nextIndex = (currentIndex + 1) % radios.length;
        $(radios[nextIndex]).prop("checked", true).trigger("change").focus();
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        const prevIndex = (currentIndex - 1 + radios.length) % radios.length;
        $(radios[prevIndex]).prop("checked", true).trigger("change").focus();
      }
      return;
    }

    const isDropdownOpen = $target
      .closest(".custom-select-wrapper")
      .find(".custom-select-options")
      .is(":visible");

    if (isDropdownOpen) {
      e.preventDefault();
      const options = $target
        .closest(".custom-select-wrapper")
        .find(".option-item:visible");
      if (options.length === 0) return;

      const currentOption = target.closest(".option-item");
      let currentIndex = options.index(currentOption);

      if (e.key === "ArrowDown") {
        currentIndex = (currentIndex + 1) % options.length;
      } else if (e.key === "ArrowUp") {
        currentIndex = (currentIndex - 1 + options.length) % options.length;
      }

      options.removeClass("active");
      $(options[currentIndex]).addClass("active").focus();
    }
  }

  function handleEscapeNavigation(e) {
    const modal = $(MODAL_SELECTOR);
    if (modal.is(":visible")) {
      modal.hide();
      if (lastFocusedElement) {
        $(lastFocusedElement).focus();
      }
    }
  }

  function handleElementFocus(element) {
    $(".keyboard-focus").removeClass("keyboard-focus");

    const $element = $(element);

    if (
      $element.attr("id") === "Step4saveExitBtn" ||
      ($element.closest(".modal-footer").length && $element.is("a"))
    ) {
      $element.addClass("keyboard-focus");
    } else if (
      $element.attr("id") === "addBankAccount" ||
      $element.hasClass("add-bank-link")
    ) {
      $element.addClass("keyboard-focus");
    } else if ($element.is('input[type="radio"]')) {
      $element.closest("label").removeClass("keyboard-focus");
      $element.addClass("keyboard-focus");
    } else if ($element.is('input[type="checkbox"]')) {
      $element.closest(".consent-box").removeClass("keyboard-focus");
      $element.addClass("keyboard-focus");
    } else if ($element.is("button") || $element.closest("button").length) {
      const btn = $element.is("button") ? $element : $element.closest("button");
      btn.addClass("keyboard-focus");
    } else if (
      $element.hasClass("upload-drop-zone") ||
      $element.closest(".upload-drop-zone").length
    ) {
      const zone = $element.hasClass("upload-drop-zone")
        ? $element
        : $element.closest(".upload-drop-zone");
      zone.addClass("keyboard-focus");
    } else if ($element.is("input, select, textarea")) {
      $element.addClass("keyboard-focus");
    } else {
      $element.addClass("keyboard-focus");
    }

    if (element.getBoundingClientRect) {
      const rect = element.getBoundingClientRect();
      const modalRect = document
        .querySelector(MODAL_SELECTOR)
        .getBoundingClientRect();

      if (
        rect.top < modalRect.top + 50 ||
        rect.bottom > modalRect.bottom - 50
      ) {
        element.scrollIntoView({
          block: "center",
          behavior: "smooth",
        });
      }
    }
  }

  $(document).ready(function () {
    initKeyboardNavigation();

    const saveExitBtn = document.getElementById("Step4saveExitBtn");
    if (saveExitBtn && !saveExitBtn.hasAttribute("tabindex")) {
      saveExitBtn.setAttribute("tabindex", "0");
      saveExitBtn.setAttribute("role", "button");
    }

    const addBankLink = document.getElementById("addBankAccount");
    if (addBankLink && !addBankLink.hasAttribute("tabindex")) {
      addBankLink.setAttribute("tabindex", "0");
      addBankLink.setAttribute("role", "button");
    }

    $(document).on(
      "click",
      ".upload-drop-zone, .radio-group input, .consent-box input",
      function () {
        const modal = $(MODAL_SELECTOR);
        if (modal.is(":visible")) {
          setTimeout(() => {
            focusableElements = getFocusableElements(modal);
          }, 100);
        }
      },
    );

    $(document).on("DOMSubtreeModified", "#bankAccountContainer", function () {
      const modal = $(MODAL_SELECTOR);
      if (modal.is(":visible")) {
        setTimeout(() => {
          focusableElements = getFocusableElements(modal);
        }, 100);
      }
    });
  });

  window.modalKeyboardStep4 = {
    getFocusableElements,
    setCurrentFocus: (index) => {
      if (focusableElements[index]) {
        $(focusableElements[index]).focus();
      }
    },
    refreshFocusList: () => {
      const modal = $(MODAL_SELECTOR);
      if (modal.is(":visible")) {
        focusableElements = getFocusableElements(modal);
      }
    },
  };
})();

$(document).on(
  "click",
  ".otp-close, .otp-toggle, .resend-link, .gst-resend-link",
  function () {
    setTimeout(() => {
      if (
        typeof modalKeyboard !== "undefined" &&
        modalKeyboard.refreshFocusList
      ) {
        modalKeyboard.refreshFocusList();
      }
    }, 100);
  },
);

$(document).on(
  "DOMSubtreeModified",
  "#emailOtpBox, #emailOtpBoxMobile, #gstOtpBox",
  function () {
    const modal = $("#step2Modal");
    if (modal.is(":visible")) {
      setTimeout(() => {
        if (
          typeof modalKeyboard !== "undefined" &&
          modalKeyboard.refreshFocusList
        ) {
          modalKeyboard.refreshFocusList();
        }
      }, 50);
    }
  },
);
