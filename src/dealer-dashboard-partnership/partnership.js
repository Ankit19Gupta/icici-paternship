(function ($) {
  "use strict";
  const $modal = $("#partnershipStep3Modal");

  const pincodeData = {
    110001: { city: "New Delhi", state: "Delhi" },
    400001: { city: "Mumbai", state: "Maharashtra" },
    700001: { city: "Kolkata", state: "West Bengal" },
    600001: { city: "Chennai", state: "Tamil Nadu" },
    560001: { city: "Bengaluru", state: "Karnataka" },
    500001: { city: "Hyderabad", state: "Telangana" },
    380001: { city: "Ahmedabad", state: "Gujarat" },
    411001: { city: "Pune", state: "Maharashtra" },
    302001: { city: "Jaipur", state: "Rajasthan" },
    226001: { city: "Lucknow", state: "Uttar Pradesh" },
  };

  function populateCityAndState($container, pincode) {
    const cleanPin = (pincode || "").replace(/\D/g, "");
    const cityInput = $container.find(
      'input[placeholder="City"], .city-display',
    );
    const stateInput = $container.find(
      'input[placeholder="State"], .state-display',
    );

    if (cleanPin.length === 6 && pincodeData[cleanPin]) {
      const info = pincodeData[cleanPin];
      if (cityInput.length)
        cityInput.val(info.city).removeClass("is-error").addClass("is-success");
      if (stateInput.length)
        stateInput
          .val(info.state)
          .removeClass("is-error")
          .addClass("is-success");
    }
  }
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
      '<div class="proprietor-wrapper">' +
      '<div class="proprietor-first-section">' +
      '<div class="proprietor-grid">' +
      '<div class="field-wrapper">' +
      "<label>First name <span>*</span></label>" +
      '<input type="text" class="partner-first-name" placeholder="Enter first name" />' +
      '<div class="error-step3-handle" style="display: none"><i class="material-icons">info</i><p>Entered first name is in wrong format, please enter a valid name.</p></div>' +
      "</div>" +
      '<div class="field-wrapper">' +
      "<label>Middle name</label>" +
      '<input type="text" class="partner-middle-name" placeholder="Enter middle name" />' +
      "</div>" +
      '<div class="field-wrapper">' +
      "<label>Last name <span>*</span></label>" +
      '<input type="text" class="partner-last-name" placeholder="Enter last name" />' +
      '<div class="error-step3-handle" style="display: none"><i class="material-icons">info</i><p>Please enter a valid last name as per PAN.</p></div>' +
      "</div>" +
      "</div>" +
      "</div>" +
      '<div class="custom-properties-middle">' +
      '<div class="properties-mobile-number-section">' +
      "<label>Mobile number <span>*</span></label>" +
      '<input type="text" class="partner-mobile" placeholder="10 digit mobile number" maxlength="14" />' +
      "</div>" +
      '<div class="error-step3-handle mobile-error-step3" style="display: none"><i class="material-icons">info</i><p>Entered mobile number is in wrong format, please enter a valid 10-digit number.</p></div>' +
      "</div>" +
      '<div class="custom-properties-middle">' +
      '<div class="field-wrapper">' +
      "<label>Email ID <span>*</span></label>" +
      '<input type="email" class="partner-email" placeholder="Enter ID" />' +
      '<div class="error-step3-handle" style="display: none"><i class="material-icons">info</i><p>Entered email ID is in wrong format, please enter a valid email id.</p></div>' +
      "</div>" +
      '<div class="field-wrapper">' +
      "<label>PAN <span>*</span></label>" +
      '<input type="text" class="partner-pan" placeholder="Enter PAN" maxlength="10" style="text-transform: uppercase" />' +
      '<div class="error-step3-handle" style="display: none"><i class="material-icons">info</i><p>Please enter a valid PAN number.</p></div>' +
      "</div>" +
      '<div class="field-wrapper">' +
      "<label>Ownership control (%) <span>*</span></label>" +
      '<input type="number" class="partner-ownership" placeholder="0" min="1" max="100" />' +
      '<div class="error-step3-handle" style="display: none"><i class="material-icons">info</i><p>Percentage must be between 1 and 100.</p></div>' +
      "</div>" +
      "</div>" +
      '<div class="proprietor-first-section">' +
      '<div class="proprietor-grid">' +
      '<div class="proprietor-gender-section field-wrapper">' +
      "<label>Gender <span>*</span></label>" +
      '<select class="form-select partner-gender">' +
      '<option value="">Select gender</option>' +
      '<option value="Male">Male</option>' +
      '<option value="Female">Female</option>' +
      '<option value="Other">Other</option>' +
      "</select>" +
      "</div>" +
      '<div class="field-wrapper date-input">' +
      "<label>Date of birth <span>*</span></label>" +
      '<input type="date" class="partner-dob" />' +
      "</div>" +
      '<div class="proprietor-gender-section field-wrapper">' +
      "<label>Community <span>*</span></label>" +
      '<select class="form-select partner-community">' +
      '<option value="">Select community</option>' +
      '<option value="Hindu">Hindu</option>' +
      '<option value="Muslim">Muslim</option>' +
      '<option value="Christian">Christian</option>' +
      '<option value="Sikh">Sikh</option>' +
      '<option value="Other">Other</option>' +
      "</select>" +
      "</div>" +
      '<div class="proprietor-gender-section field-wrapper">' +
      "<label>Category <span>*</span></label>" +
      '<select class="form-select partner-category">' +
      '<option value="">Select category</option>' +
      '<option value="General">General</option>' +
      '<option value="OBC">OBC</option>' +
      '<option value="SC">SC</option>' +
      '<option value="ST">ST</option>' +
      "</select>" +
      "</div>" +
      "</div>" +
      "</div>" +
      '<div class="custom-properties-middle">' +
      '<div class="field-wrapper" style="grid-column: span 2">' +
      "<label>Address <span>*</span></label>" +
      '<input type="text" class="partner-address" placeholder="Enter address" />' +
      '<div class="error-step3-handle" style="display: none"><i class="material-icons">info</i><p>Please enter a valid Address.</p></div>' +
      "</div>" +
      '<div class="field-wrapper">' +
      "<label>Pin code <span>*</span></label>" +
      '<input type="text" class="partner-pincode" placeholder="Enter pin code" maxlength="6" />' +
      '<div class="error-step3-handle" style="display: none"><i class="material-icons">info</i><p>Entered pin code is in wrong format, please enter a valid 6 digit pin.</p></div>' +
      "</div>" +
      "</div>" +
      '<div class="partner-asset-top">' +
      '<button type="button" class="partner-reset-btn">Reset</button>' +
      '<button type="button" class="partner-save-btn" disabled>Save</button>' +
      "</div>" +
      "</div>" +
      "</div>" +
      "</div>"
    );
  }

  // Accordion Validation
  function isAccordionDataValid($accordion) {
    if (!$accordion || $accordion.hasClass("saved")) return true;
    const $content = $accordion.find(".partner-accordion-content");
    if (!$content.length || $content.is(":hidden")) return false;

    const firstName = $content
      .find('.partner-first-name, input[placeholder="Enter first name"]')
      .val()
      .trim();
    const lastName = $content
      .find('.partner-last-name, input[placeholder="Enter last name"]')
      .val()
      .trim();
    const mobile = $content
      .find('.partner-mobile, input[placeholder="10 digit mobile number"]')
      .val()
      .trim();
    const email = $content
      .find('.partner-email, input[placeholder="Enter ID"]')
      .val()
      .trim();
    const pan = $content
      .find('.partner-pan, input[placeholder="Enter PAN"]')
      .val()
      .trim();
    const ownership = $content
      .find('.partner-ownership, input[placeholder="0"]')
      .val()
      .trim();
    const gender = $content.find(".partner-gender, select").eq(0).val();
    const dob = $content.find('.partner-dob, input[type="date"]').val();
    const community = $content.find(".partner-community, select").eq(1).val();
    const category = $content.find(".partner-category, select").eq(2).val();
    const address = $content
      .find('.partner-address, input[placeholder="Enter address"]')
      .val()
      .trim();
    const pincode = $content
      .find('.partner-pincode, input[placeholder="Enter pin code"]')
      .val()
      .trim();

    const mobileDigits = mobile.replace(/\D/g, "");

    return (
      firstName !== "" &&
      lastName !== "" &&
      mobileDigits.length === 10 &&
      email !== "" &&
      email.indexOf("@") !== -1 &&
      email.indexOf(".") !== -1 &&
      pan.length === 10 &&
      ownership !== "" &&
      parseFloat(ownership) > 0 &&
      gender &&
      gender !== "" &&
      dob &&
      dob !== "" &&
      community &&
      community !== "" &&
      category &&
      category !== "" &&
      address !== "" &&
      pincode.length === 6
    );
  }

  // Updates UI Validation
  function updateValidationState($accordion) {
    if (!$accordion || $accordion.hasClass("saved")) return;
    const isValid = isAccordionDataValid($accordion);
    const $btn = $accordion.find(".partner-save-btn");
    $btn.prop("disabled", !isValid);
    if (isValid) {
      $btn.addClass("enabled").removeClass("disabled");
    } else {
      $btn.addClass("disabled").removeClass("enabled");
    }
  }

  // Partnership Step 3 Validation
  function validatePartnershipStep3() {
    const $targetModal = $("#partnershipStep3Modal");
    const count = parseInt($targetModal.find("#partnerCount").val()) || 0;
    const total = $targetModal.find(
      "#partnerAccordionContainer .partner-accordion",
    ).length;
    const saved = $targetModal.find(
      "#partnerAccordionContainer .partner-accordion.saved",
    ).length;

    return count >= 2 && count <= 20 && total === count && saved === count;
  }
  // Update Submit Button
  function updateSubmitButtonState() {
    const isValid = validatePartnershipStep3();
    const $targetModal = $("#partnershipStep3Modal");
    const $nextBtn = $targetModal.find(
      "#partnershipStep3NextBtn, #patrnershipStep3NextBtn, #step3NextBtn",
    );

    if (isValid) {
      $nextBtn
        .prop("disabled", false)
        .addClass("btn-enabled")
        .removeClass("btn-disabled");
    } else {
      $nextBtn
        .prop("disabled", true)
        .addClass("btn-disabled")
        .removeClass("btn-enabled");
    }
  }
  // Resets Partnership
  function resetPartnershipStep3Form() {
    const $targetModal = $("#partnershipStep3Modal");
    $targetModal.find("#partnerCount").val("");
    $targetModal.find("#partnerAccordionContainer").empty();
    $targetModal.find(".error-step3-handle").hide();
    updateSubmitButtonState();
  }
  // Open and close Modal
  function openPartnershipStep3Modal() {
    $("#partnershipStep3Modal").show();
  }

  function closePartnershipStep3Modal() {
    $("#partnershipStep3Modal").hide();
  }

  // API Integration
  function handleApiRequest(formData, onSuccess, onError) {
    console.log("Partnership Step 3 API Request payload:", formData);
    if (typeof onSuccess === "function") {
      onSuccess({ success: true, message: "Step 3 submitted successfully" });
    }
  }

  // Partner count change
  $(document)
    .off("input change", "#partnershipStep3Modal #partnerCount")
    .on("input change", "#partnershipStep3Modal #partnerCount", function (e) {
      const count = parseInt($(this).val()) || 0;
      const $container = $("#partnershipStep3Modal #partnerAccordionContainer");
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

      if (count >= 2 && count <= 20) {
        const currentCount = $container.find(".partner-accordion").length;
        if (count > currentCount) {
          for (let i = currentCount + 1; i <= count; i++) {
            $container.append(getPartnerFormHtml(i));
          }
        } else if (count < currentCount) {
          $container.find(".partner-accordion").each(function () {
            if ($(this).data("partner") > count) {
              $(this).remove();
            }
          });
        }
      }
      updateSubmitButtonState();
    });

  // Accordion Header Toggle
  $(document)
    .off("click", "#partnershipStep3Modal .partner-accordion-header")
    .on(
      "click",
      "#partnershipStep3Modal .partner-accordion-header",
      function (e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        const $currentAccordion = $(this).closest(".partner-accordion");
        const $currentContent = $currentAccordion.find(
          ".partner-accordion-content",
        );
        const isVisible = $currentContent.is(":visible");

        $("#partnershipStep3Modal .partner-accordion")
          .not($currentAccordion)
          .each(function () {
            $(this).removeClass("active");
            $(this).find(".partner-accordion-content").slideUp(200);
            $(this)
              .find(".partner-accordion-header i.material-icons")
              .text("expand_more");
          });

        if (isVisible) {
          $currentAccordion.removeClass("active");
          $currentContent.slideUp(200);
          $(this).find("i.material-icons").text("expand_more");
        } else {
          $currentAccordion.addClass("active");
          $currentContent.slideDown(200);
          $(this).find("i.material-icons").text("expand_less");
        }
        updateValidationState($currentAccordion);
      },
    );

  // Accordion Form Inputs Change
  $(document)
    .off(
      "input change",
      "#partnershipStep3Modal .partner-accordion-content input, #partnershipStep3Modal .partner-accordion-content select",
    )
    .on(
      "input change",
      "#partnershipStep3Modal .partner-accordion-content input, #partnershipStep3Modal .partner-accordion-content select",
      function () {
        const $accordion = $(this).closest(".partner-accordion");
        if ($accordion.length && !$accordion.hasClass("saved")) {
          updateValidationState($accordion);
        }
      },
    );

  // Pincode auto-fill
  $(document)
    .off("blur", '#partnershipStep3Modal input[placeholder="Enter pin code"]')
    .on(
      "blur",
      '#partnershipStep3Modal input[placeholder="Enter pin code"]',
      function () {
        const val = $(this).val().replace(/\D/g, "");
        const $container = $(this).closest(".partner-accordion-content");
        if (val.length === 6) {
          populateCityAndState($container, val);
        }
      },
    );

  // Mobile formatting
  $(document)
    .off(
      "blur",
      '#partnershipStep3Modal input[placeholder="10 digit mobile number"]',
    )
    .on(
      "blur",
      '#partnershipStep3Modal input[placeholder="10 digit mobile number"]',
      function () {
        const $input = $(this);
        let value = $input.val().trim();
        if (value && !value.startsWith("+91")) {
          const clean = value.replace(/^\+91\s*/, "").replace(/\D/g, "");
          if (clean.length === 10) {
            $input.val("+91 " + clean);
          }
        }
      },
    );

  // Save Partner Button
  $(document)
    .off("click", "#partnershipStep3Modal .partner-save-btn")
    .on("click", "#partnershipStep3Modal .partner-save-btn", function (e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      const $accordion = $(this).closest(".partner-accordion");
      const num = $accordion.data("partner");
      const $content = $accordion.find(".partner-accordion-content");

      const firstName = $content
        .find('.partner-first-name, input[placeholder="Enter first name"]')
        .val()
        .trim();
      const lastName = $content
        .find('.partner-last-name, input[placeholder="Enter last name"]')
        .val()
        .trim();
      const mobile = $content
        .find('.partner-mobile, input[placeholder="10 digit mobile number"]')
        .val()
        .trim();
      const email = $content
        .find('.partner-email, input[placeholder="Enter ID"]')
        .val()
        .trim();
      const pan = $content
        .find('.partner-pan, input[placeholder="Enter PAN"]')
        .val()
        .trim();
      const ownership = $content
        .find('.partner-ownership, input[placeholder="0"]')
        .val()
        .trim();
      const gender = $content.find(".partner-gender, select").eq(0).val() || "";
      const dob = $content.find('.partner-dob, input[type="date"]').val() || "";
      const community =
        $content.find(".partner-community, select").eq(1).val() || "";
      const category =
        $content.find(".partner-category, select").eq(2).val() || "";
      const address = $content
        .find('.partner-address, input[placeholder="Enter address"]')
        .val()
        .trim();

      const fullName = (firstName + " " + lastName).trim();

      const summaryHtml = `
        <div class="partner-summary">
          <div class="partner-summary-grid">
            <div><p class="partner-summary-label">Name</p><p class="partner-summary-value">${fullName}</p></div>
            <div><p class="partner-summary-label">Mobile number</p><p class="partner-summary-value">${mobile}</p></div>
            <div><p class="partner-summary-label">Email ID</p><p class="partner-summary-value">${email}</p></div>
            <div><p class="partner-summary-label">PAN</p><p class="partner-summary-value">${pan.toUpperCase()}</p></div>
            <div><p class="partner-summary-label">Ownership control</p><p class="partner-summary-value">${ownership}%</p></div>
            <div><p class="partner-summary-label">Gender</p><p class="partner-summary-value">${gender}</p></div>
            <div><p class="partner-summary-label">Date of birth</p><p class="partner-summary-value">${dob}</p></div>
            <div><p class="partner-summary-label">Community</p><p class="partner-summary-value">${community}</p></div>
            <div><p class="partner-summary-label">Category</p><p class="partner-summary-value">${category}</p></div>
            <div><p class="partner-summary-label">Address</p><p class="partner-summary-value">${address}</p></div>
          </div>
        </div>`;

      $accordion.find(".partner-summary").remove();
      $accordion.find(".partner-edit-btn").remove();
      $accordion
        .find(".partner-accordion-header")
        .append(
          '<span class="partner-edit-btn"><i class="material-icons">edit</i> Edit</span>',
        );
      $accordion.find(".partner-accordion-header").after(summaryHtml);
      $accordion.addClass("saved").removeClass("active");
      $content.slideUp(200);

      updateSubmitButtonState();
    });

  // Edit Partner Button
  $(document)
    .off("click", "#partnershipStep3Modal .partner-edit-btn")
    .on("click", "#partnershipStep3Modal .partner-edit-btn", function (e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      const $accordion = $(this).closest(".partner-accordion");
      $accordion.find(".partner-summary").remove();
      $accordion.find(".partner-edit-btn").remove();
      $accordion.removeClass("saved").addClass("active");
      $accordion.find(".partner-accordion-content").slideDown(200);
      updateSubmitButtonState();
    });

  // Reset Partner Button
  $(document)
    .off("click", "#partnershipStep3Modal .partner-reset-btn")
    .on("click", "#partnershipStep3Modal .partner-reset-btn", function (e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      const $accordion = $(this).closest(".partner-accordion");
      $accordion.find("input").val("");
      $accordion.find("select").val("");
      $accordion.find(".error-step3-handle").hide();
      updateValidationState($accordion);
    });

  // Modal Close & Navigation
  $(document)
    .off("click", "#modalPartnershipStep3CloseBtn, #cancelPartnershipStep3Btn")
    .on(
      "click",
      "#modalPartnershipStep3CloseBtn, #cancelPartnershipStep3Btn",
      function (e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        closePartnershipStep3Modal();
      },
    );

  $(document)
    .off("click", "#partnershipStep3NextBtn, #patrnershipStep3NextBtn")
    .on(
      "click",
      "#partnershipStep3NextBtn, #patrnershipStep3NextBtn",
      function (e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        const isDataValid = validatePartnershipStep3();
        if (isDataValid) {
          handleApiRequest({}, function () {
            closePartnershipStep3Modal();
            if ($("#reviewModal").length) {
              $("#reviewModal").show();
            }
          });
        }
      },
    );

  //  5. PUBLIC REUSABLE API EXPOSITION
  window.partnershipStep3 = {
    open: openPartnershipStep3Modal,
    close: closePartnershipStep3Modal,
    reset: resetPartnershipStep3Form,
    validate: validatePartnershipStep3,
    updateSubmitState: updateSubmitButtonState,
    handleApiRequest: handleApiRequest,
  };
})(jQuery);
