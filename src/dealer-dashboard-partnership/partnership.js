(function ($) {
  "use strict";

  // ==========================================================================
  // PINCODE DATABASE FOR AUTO-POPULATING CITY & STATE
  // ==========================================================================
  const pincodeData = {
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

  // ==========================================================================
  // REMOVE PREVIOUS CONFLICTING HANDLERS FROM OLD / UNUSED CODE
  // ==========================================================================
  $(document).off("click", ".partner-accordion-header");
  $(document).off("click", ".partner-save-btn");
  $(document).off("click", ".partner-edit-btn");
  $(document).off("click", ".partner-reset-btn");
  $(document).off("input change", "#partnerCount");
  $(document).off("focus", "#partnerCount");
  $(document).off("click", "#partnershipStep3NextBtn, #step3NextBtn");
  $(document).off("click", "#cancelPartnershipStep3Btn, #cancelStep3Btn");
  $(document).off("click", "#modalPartnershipStep3CloseBtn");
  $(document).off("click", "#partnershipSaveExitBtn");

  // ==========================================================================
  // MODAL NAVIGATION & UTILITIES
  // ==========================================================================
  function openPartnershipStep3Modal() {
    $("#partnershipStep3Modal").show();
    checkAllPartnersSaved();
  }

  function closePartnershipStep3Modal() {
    $("#partnershipStep3Modal").hide();
  }

  // Copy Application Number to Clipboard
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

      const $icon = $(this).is(".copy-icon") ? $(this) : $(this).find(".copy-icon");
      const originalText = $icon.text();
      $icon.text("done");
      setTimeout(function () {
        $icon.text(originalText);
      }, 1500);
    }
  );

  // Close & Back Handlers
  $(document).on("click", "#modalPartnershipStep3CloseBtn", function (e) {
    e.preventDefault();
    closePartnershipStep3Modal();
  });

  $(document).on(
    "click",
    "#cancelPartnershipStep3Btn, #cancelStep3Btn",
    function (e) {
      e.preventDefault();
      closePartnershipStep3Modal();
      if ($("#step2Modal").length) {
        $("#step2Modal").show();
      }
    }
  );

  // Save & Exit Handler
  $(document).on("click", "#partnershipSaveExitBtn", function (e) {
    e.preventDefault();
    if ($(this).hasClass("disabled-link") || $(this).prop("disabled")) return;

    closePartnershipStep3Modal();
    if ($("#saveProgressModal").length) {
      $("#saveProgressModal").show();
    }
  });

  // Step 2 Next Button -> Open Partnership Step 3
  $(document).on("click", "#step2NextBtn", function () {
    $("#step2Modal").hide();
    openPartnershipStep3Modal();
  });

  // Proceed / Next Button
  $(document).on(
    "click",
    "#partnershipStep3NextBtn, #step3NextBtn",
    function (e) {
      e.preventDefault();
      if ($(this).prop("disabled")) return;

      if (validatePartnershipStep3()) {
        closePartnershipStep3Modal();
        if ($("#step4Modal").length) {
          $("#step4Modal").show();
        } else if ($("#reviewModal").length) {
          $("#reviewModal").show();
        }
      }
    }
  );

  // ==========================================================================
  // DYNAMIC PARTNER HTML TEMPLATE GENERATOR
  // ==========================================================================
  function getPartnerFormHtml(num) {
    return (
      '<div class="partner-accordion" data-partner="' + num + '">' +
        '<div class="partner-accordion-header">' +
          '<span class="partner-accordion-span">Partner ' + num + '</span>' +
          '<i class="material-icons">expand_more</i>' +
        '</div>' +
        '<div class="partner-accordion-content" style="display: none">' +
          '<div class="proprietor-grid custom-margin">' +
            '<div class="proprietor-first-section">' +
              '<div class="proprietor-gender">' +
                '<label>Title</label>' +
                '<div class="custom-select-wrapper">' +
                  '<div class="custom-select-trigger">' +
                    '<span class="selected-option">Mr.</span>' +
                    '<div class="select-right"><i class="material-icons">expand_more</i></div>' +
                  '</div>' +
                  '<div class="custom-select-options" style="display: none">' +
                    '<div class="option-item selected" data-value="mr">Mr.</div>' +
                    '<div class="option-item" data-value="miss">Miss.</div>' +
                    '<div class="option-item" data-value="ms">Ms.</div>' +
                    '<div class="option-item" data-value="dr">Dr.</div>' +
                  '</div>' +
                '</div>' +
                '<select style="display: none"><option value="mr" selected>Mr.</option><option value="miss">Miss.</option><option value="ms">Ms.</option><option value="dr">Dr.</option></select>' +
              '</div>' +
              '<div class="field-wrapper">' +
                '<label>First name as per PAN <span class="partner-required">*</span></label>' +
                '<input type="text" class="partner-first-name" placeholder="Enter first name" />' +
                '<div class="error-step3-handle" style="display: none"><i class="material-icons">info</i><p>Entered first name is in wrong format, please enter a valid name.</p></div>' +
              '</div>' +
            '</div>' +
            '<div>' +
              '<div class="properties-middle">' +
                '<div class="custom-properties-middle">' +
                  '<label>Middle name <span class="incorporation-yy">(optional)</span></label>' +
                  '<input type="text" class="partner-middle-name" placeholder="Enter middle name" />' +
                '</div>' +
                '<div class="custom-properties-middle field-wrapper error-state-pan">' +
                  '<label>Last name as per PAN <span class="partner-required">*</span></label>' +
                  '<input type="text" class="partner-last-name" placeholder="Enter last name" />' +
                  '<div class="error-step3-handle" style="display: none"><i class="material-icons">info</i><p>Please enter a valid last name as per PAN.</p></div>' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<div class="field-wrapper">' +
              '<label>Mobile number <span class="partner-required">*</span></label>' +
              '<div class="properties-mobile-number-section">' +
                '<input type="text" class="partner-mobile" placeholder="10 digit mobile number" maxlength="14" />' +
              '</div>' +
              '<div class="error-step3-handle" style="display: none"><i class="material-icons">info</i><p>Entered mobile number is in wrong format, please enter a valid 10-digit number.</p></div>' +
            '</div>' +
            '<div class="field-wrapper">' +
              '<label>Email ID <span class="partner-required">*</span></label>' +
              '<input type="email" class="partner-email" placeholder="Enter ID" />' +
              '<div class="error-step3-handle" style="display: none"><i class="material-icons">info</i><p>Entered email ID is in wrong format, please enter a valid email id.</p></div>' +
            '</div>' +
            '<div class="field-wrapper">' +
              '<label>PAN number <span class="partner-required">*</span></label>' +
              '<input type="text" class="partner-pan" placeholder="Enter PAN" maxlength="10" style="text-transform: uppercase" />' +
              '<div class="error-step3-handle" style="display: none"><i class="material-icons">info</i><p>Please enter a valid PAN number.</p></div>' +
            '</div>' +
            '<div class="field-wrapper">' +
              '<label>Ownership control (%) <span class="partner-required">*</span></label>' +
              '<div class="position">' +
                '<input type="number" class="partner-ownership ownership-input" placeholder="0" min="1" max="100" />' +
                '<span class="percentage-owner">%</span>' +
              '</div>' +
              '<div class="error-step3-handle" style="display: none"><i class="material-icons">info</i><p>Percentage must be between 1 and 100.</p></div>' +
            '</div>' +
            '<div>' +
              '<div class="proprietor-gender-section field-wrapper">' +
                '<label>Gender <span class="partner-required">*</span></label>' +
                '<div class="custom-select-wrapper">' +
                  '<div class="custom-select-trigger">' +
                    '<span class="selected-option">Select gender</span>' +
                    '<div class="select-right"><i class="material-icons">expand_more</i></div>' +
                  '</div>' +
                  '<div class="custom-select-options" style="display: none">' +
                    '<div class="option-item" data-value="">Select gender</div>' +
                    '<div class="option-item" data-value="Male">Male</div>' +
                    '<div class="option-item" data-value="Female">Female</div>' +
                    '<div class="option-item" data-value="Others">Others</div>' +
                  '</div>' +
                '</div>' +
                '<select class="partner-gender" style="display: none">' +
                  '<option value="">Select gender</option>' +
                  '<option value="Male">Male</option>' +
                  '<option value="Female">Female</option>' +
                  '<option value="Others">Others</option>' +
                '</select>' +
              '</div>' +
            '</div>' +
            '<div>' +
              '<div class="width field-wrapper">' +
                '<label>Date of birth as per aadhaar <span class="incorporation-yy">(yyyy-mm-dd)</span> <span class="partner-required">*</span></label>' +
                '<div class="date-input">' +
                  '<input type="date" class="partner-dob dobDate" />' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="proprietor-grid">' +
            '<div>' +
              '<div class="field-wrapper">' +
                '<label>Address <span class="partner-required">*</span></label>' +
                '<input type="text" class="partner-address" placeholder="Enter address" />' +
                '<div class="error-step3-handle" style="display: none"><i class="material-icons">info</i><p>Please enter a valid Address.</p></div>' +
              '</div>' +
              '<div class="field-wrapper city-field cityAddressBlock" style="display: none">' +
                '<label>City <span class="urc-p">*</span></label>' +
                '<div class="custom-select-wrapper cityCustomSelect">' +
                  '<div class="custom-select-trigger">' +
                    '<span class="selected-option">Select city</span>' +
                    '<div class="select-right"><i class="material-icons">expand_more</i></div>' +
                  '</div>' +
                  '<div class="custom-select-options" style="display: none">' +
                    '<div class="option-item" data-value="">Select city</div>' +
                  '</div>' +
                '</div>' +
                '<select class="city-select" style="display: none"><option value="">Select city</option></select>' +
              '</div>' +
            '</div>' +
            '<div>' +
              '<div class="field-wrapper">' +
                '<label>Pin code <span class="partner-required">*</span></label>' +
                '<input type="text" inputmode="numeric" class="partner-pincode pincode-input" placeholder="Enter pin code" maxlength="6" />' +
                '<div class="error-step3-handle" style="display: none"><i class="material-icons">info</i><p>Entered pin code is in wrong format, please enter a valid 6 digit pin.</p></div>' +
              '</div>' +
              '<div class="field-wrapper city-field cityAddressBlock" style="display: none">' +
                '<label>State <span class="urc-p">*</span></label>' +
                '<div class="state-display-wrapper">' +
                  '<input type="text" class="partner-state state-input" placeholder="State" readonly />' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<div>' +
              '<div class="proprietor-gender-section field-wrapper">' +
                '<label>Community <span class="partner-required">*</span></label>' +
                '<div class="custom-select-wrapper">' +
                  '<div class="custom-select-trigger">' +
                    '<span class="selected-option">Select community</span>' +
                    '<div class="select-right"><i class="material-icons">expand_more</i></div>' +
                  '</div>' +
                  '<div class="custom-select-options" style="display: none">' +
                    '<div class="option-item" data-value="">Select community</div>' +
                    '<div class="option-item" data-value="Hindu">Hindu</div>' +
                    '<div class="option-item" data-value="Muslim">Muslim</div>' +
                    '<div class="option-item" data-value="Sikh">Sikh</div>' +
                    '<div class="option-item" data-value="Christian">Christian</div>' +
                    '<div class="option-item" data-value="Jain">Jain</div>' +
                    '<div class="option-item" data-value="Buddhist">Buddhist</div>' +
                    '<div class="option-item" data-value="Parsi">Parsi</div>' +
                    '<div class="option-item" data-value="Others">Others</div>' +
                  '</div>' +
                '</div>' +
                '<select class="partner-community" style="display: none">' +
                  '<option value="">Select community</option>' +
                  '<option value="Hindu">Hindu</option>' +
                  '<option value="Muslim">Muslim</option>' +
                  '<option value="Sikh">Sikh</option>' +
                  '<option value="Christian">Christian</option>' +
                  '<option value="Jain">Jain</option>' +
                  '<option value="Buddhist">Buddhist</option>' +
                  '<option value="Parsi">Parsi</option>' +
                  '<option value="Others">Others</option>' +
                '</select>' +
              '</div>' +
            '</div>' +
            '<div>' +
              '<div class="proprietor-gender-section field-wrapper">' +
                '<label>Category <span class="partner-required">*</span></label>' +
                '<div class="custom-select-wrapper">' +
                  '<div class="custom-select-trigger">' +
                    '<span class="selected-option">Select category</span>' +
                    '<div class="select-right"><i class="material-icons">expand_more</i></div>' +
                  '</div>' +
                  '<div class="custom-select-options" style="display: none">' +
                    '<div class="option-item" data-value="">Select category</div>' +
                    '<div class="option-item" data-value="General">General</div>' +
                    '<div class="option-item" data-value="OBC">OBC</div>' +
                    '<div class="option-item" data-value="SC">SC</div>' +
                    '<div class="option-item" data-value="ST">ST</div>' +
                    '<div class="option-item" data-value="EWS">EWS</div>' +
                  '</div>' +
                '</div>' +
                '<select class="partner-category" style="display: none">' +
                  '<option value="">Select category</option>' +
                  '<option value="General">General</option>' +
                  '<option value="OBC">OBC</option>' +
                  '<option value="SC">SC</option>' +
                  '<option value="ST">ST</option>' +
                  '<option value="EWS">EWS</option>' +
                '</select>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="partner-asset-top">' +
            '<button type="button" class="partner-reset-btn">Reset</button>' +
            '<button type="button" class="partner-save-btn" disabled>Save</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  // ==========================================================================
  // PINCODE CITY & STATE AUTOFILL (SCOPED TO ACCORDION)
  // ==========================================================================
  function populateCityAndState($container, pincode) {
    const cleanPin = (pincode || "").replace(/\D/g, "");
    const cityBlock = $container.find(".cityAddressBlock");
    const citySelect = $container.find(".cityCustomSelect");
    const stateInput = $container.find(".partner-state, .state-input");

    if (cleanPin.length === 6 && pincodeData[cleanPin]) {
      const info = pincodeData[cleanPin];
      cityBlock.show();

      if (stateInput.length) {
        stateInput.val(info.state).removeClass("is-error").addClass("is-success");
      }

      if (citySelect.length) {
        const optionsContainer = citySelect.find(".custom-select-options");
        const triggerSpan = citySelect.find(".custom-select-trigger .selected-option");
        const hiddenSelect = citySelect.siblings("select.city-select");

        optionsContainer.empty();
        info.cities.forEach(function (city) {
          optionsContainer.append('<div class="option-item" data-value="' + city + '">' + city + '</div>');
        });

        const selectedCity = info.cities[0] || "";
        triggerSpan.text(selectedCity).removeClass("placeholder");
        if (hiddenSelect.length) {
          hiddenSelect.empty();
          info.cities.forEach(function (city) {
            hiddenSelect.append('<option value="' + city + '">' + city + '</option>');
          });
          hiddenSelect.val(selectedCity);
        }
        optionsContainer.find('.option-item[data-value="' + selectedCity + '"]').addClass("selected");
      }
    } else if (cleanPin.length === 6) {
      cityBlock.show();
      if (stateInput.length) stateInput.val("Not found").addClass("is-error");
      if (citySelect.length) {
        citySelect.find(".selected-option").text("Select city");
        citySelect.siblings("select").val("");
      }
    } else {
      cityBlock.hide();
      if (stateInput.length) stateInput.val("").removeClass("is-error is-success");
      if (citySelect.length) {
        citySelect.find(".selected-option").text("Select city");
        citySelect.siblings("select").val("");
      }
    }
  }

  // ==========================================================================
  // CUSTOM SELECT DROPDOWN LOGIC
  // ==========================================================================
  $(document).on("click", "#partnershipStep3Modal .custom-select-trigger", function (e) {
    e.stopPropagation();
    const wrapper = $(this).closest(".custom-select-wrapper");
    const options = wrapper.find(".custom-select-options");
    const isOpen = options.is(":visible");

    $("#partnershipStep3Modal .custom-select-options").not(options).hide();
    $("#partnershipStep3Modal .custom-select-trigger").not(this).removeClass("active");

    if (isOpen) {
      options.hide();
      $(this).removeClass("active");
    } else {
      options.show();
      $(this).addClass("active");
    }
  });

  $(document).on("click", "#partnershipStep3Modal .custom-select-options .option-item", function (e) {
    e.stopPropagation();
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

    const $accordion = wrapper.closest(".partner-accordion");
    if ($accordion.length && !$accordion.hasClass("saved")) {
      updateValidationState($accordion);
    }
  });

  $(document).on("click", function (e) {
    if (!$(e.target).closest("#partnershipStep3Modal .custom-select-wrapper").length) {
      $("#partnershipStep3Modal .custom-select-options").hide();
      $("#partnershipStep3Modal .custom-select-trigger").removeClass("active");
    }
  });

  // ==========================================================================
  // INPUT MASKS & SANITIZATION
  // ==========================================================================
  // Names: letters only
  $(document).on(
    "input",
    '#partnershipStep3Modal input.partner-first-name, #partnershipStep3Modal input.partner-middle-name, #partnershipStep3Modal input.partner-last-name, #partnershipStep3Modal input[placeholder*="first name"], #partnershipStep3Modal input[placeholder*="middle name"], #partnershipStep3Modal input[placeholder*="last name"]',
    function () {
      $(this).val($(this).val().replace(/[^a-zA-Z\s]/g, ""));
    }
  );

  // Mobile: numbers only, max 10
  $(document).on(
    "input",
    '#partnershipStep3Modal input.partner-mobile, #partnershipStep3Modal input[placeholder="10 digit mobile number"]',
    function () {
      let clean = $(this).val().replace(/\D/g, "");
      if (clean.length > 10) clean = clean.slice(0, 10);
      $(this).val(clean);
    }
  );

  $(document).on(
    "blur",
    '#partnershipStep3Modal input.partner-mobile, #partnershipStep3Modal input[placeholder="10 digit mobile number"]',
    function () {
      const clean = $(this).val().replace(/^\+91\s*/, "").replace(/\D/g, "");
      const errorDiv = $(this).closest(".field-wrapper").find(".error-step3-handle");

      if (clean.length > 0 && clean.length !== 10) {
        errorDiv.show();
        $(this).addClass("is-error").removeClass("is-success");
      } else if (clean.length === 10) {
        errorDiv.hide();
        $(this).val("+91 " + clean).removeClass("is-error").addClass("is-success");
      } else {
        errorDiv.hide();
        $(this).removeClass("is-error is-success");
      }
    }
  );

  // Email: no spaces, validation
  $(document).on(
    "input",
    '#partnershipStep3Modal input.partner-email, #partnershipStep3Modal input[placeholder="Enter ID"]',
    function () {
      $(this).val($(this).val().replace(/\s/g, ""));
    }
  );

  $(document).on(
    "blur",
    '#partnershipStep3Modal input.partner-email, #partnershipStep3Modal input[placeholder="Enter ID"]',
    function () {
      const val = $(this).val().trim();
      const errorDiv = $(this).closest(".field-wrapper").find(".error-step3-handle");
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

      if (val.length > 0 && !isValid) {
        errorDiv.show();
        $(this).addClass("is-error").removeClass("is-success");
      } else if (isValid) {
        errorDiv.hide();
        $(this).removeClass("is-error").addClass("is-success");
      } else {
        errorDiv.hide();
        $(this).removeClass("is-error is-success");
      }
    }
  );

  // PAN: uppercase, alphanumeric, 10 chars
  $(document).on(
    "input",
    '#partnershipStep3Modal input.partner-pan, #partnershipStep3Modal input[placeholder="Enter PAN"]',
    function () {
      $(this).val($(this).val().replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 10));
    }
  );

  $(document).on(
    "blur",
    '#partnershipStep3Modal input.partner-pan, #partnershipStep3Modal input[placeholder="Enter PAN"]',
    function () {
      const val = $(this).val().trim();
      const errorDiv = $(this).closest(".field-wrapper").find(".error-step3-handle");
      const isValid = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val) || val.length === 10;

      if (val.length > 0 && !isValid) {
        errorDiv.show();
        $(this).addClass("is-error").removeClass("is-success");
      } else if (val.length === 10) {
        errorDiv.hide();
        $(this).removeClass("is-error").addClass("is-success");
      } else {
        errorDiv.hide();
        $(this).removeClass("is-error is-success");
      }
    }
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
    }
  );

  $(document).on(
    "blur",
    '#partnershipStep3Modal input.partner-pincode, #partnershipStep3Modal input.pincode-input, #partnershipStep3Modal input[placeholder="Enter pin code"]',
    function () {
      const val = $(this).val().replace(/\D/g, "");
      const errorDiv = $(this).closest(".field-wrapper").find(".error-step3-handle");
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
    }
  );

  // Address
  $(document).on(
    "input",
    '#partnershipStep3Modal input.partner-address, #partnershipStep3Modal input[placeholder="Enter address"]',
    function () {
      $(this).val($(this).val().replace(/[^a-zA-Z0-9\s,.-]/g, ""));
    }
  );

  // Ownership: 1 to 100
  $(document).on(
    "input",
    '#partnershipStep3Modal input.partner-ownership, #partnershipStep3Modal input.ownership-input',
    function () {
      let val = parseFloat($(this).val());
      if (val > 100) $(this).val(100);
      if (val < 0) $(this).val(0);
    }
  );

  // Focus clears error
  $(document).on("focus", "#partnershipStep3Modal input", function () {
    $(this).removeClass("is-error");
    $(this).closest(".field-wrapper").find(".error-step3-handle").hide();
  });

  // ==========================================================================
  // ACCORDION VALIDATION
  // ==========================================================================
  function isAccordionDataValid($accordion) {
    if (!$accordion || $accordion.hasClass("saved")) return true;
    const $content = $accordion.find(".partner-accordion-content");
    if (!$content.length || $content.is(":hidden")) return false;

    const firstName = ($content.find('.partner-first-name, input[placeholder="Enter first name"]').val() || "").trim();
    const lastName = ($content.find('.partner-last-name, input[placeholder="Enter last name"]').val() || "").trim();
    const mobile = ($content.find('.partner-mobile, input[placeholder="10 digit mobile number"]').val() || "").replace(/\D/g, "");
    const email = ($content.find('.partner-email, input[placeholder="Enter ID"]').val() || "").trim();
    const pan = ($content.find('.partner-pan, input[placeholder="Enter PAN"]').val() || "").trim();
    const ownership = parseFloat($content.find('.partner-ownership, input.ownership-input, input[placeholder="0"]').val());
    
    // Gender
    const genderSel = $content.find(".partner-gender, select").eq(0).val() || "";
    const genderText = $content.find(".proprietor-gender-section .selected-option").first().text().trim();
    const genderValid = (genderSel && genderSel !== "Select gender") || (genderText && genderText !== "Select gender");

    // DOB
    const dob = $content.find('.partner-dob, .dobDate, input[type="date"]').val();

    // Address & Pin
    const address = ($content.find('.partner-address, input[placeholder="Enter address"]').val() || "").trim();
    const pincode = ($content.find('.partner-pincode, input.pincode-input, input[placeholder="Enter pin code"]').val() || "").replace(/\D/g, "");

    // Community
    const communitySel = $content.find(".partner-community").val() || "";
    const communityEls = $content.find(".proprietor-gender-section .selected-option");
    const communityText = communityEls.length > 1 ? communityEls.eq(1).text().trim() : "";
    const communityValid = (communitySel && communitySel !== "Select community") || (communityText && communityText !== "Select community");

    // Category
    const categorySel = $content.find(".partner-category").val() || "";
    const categoryText = communityEls.length > 2 ? communityEls.eq(2).text().trim() : "";
    const categoryValid = (categorySel && categorySel !== "Select category") || (categoryText && categoryText !== "Select category");

    return (
      firstName.length >= 2 &&
      lastName.length >= 2 &&
      mobile.length === 10 &&
      email !== "" &&
      email.indexOf("@") !== -1 &&
      email.indexOf(".") !== -1 &&
      pan.length === 10 &&
      !isNaN(ownership) &&
      ownership > 0 &&
      ownership <= 100 &&
      genderValid &&
      dob &&
      dob !== "" &&
      address.length >= 3 &&
      pincode.length === 6 &&
      communityValid &&
      categoryValid
    );
  }

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

  // ==========================================================================
  // STEP 3 OVERALL VALIDATION & SUBMIT STATE
  // ==========================================================================
  function validatePartnershipStep3() {
    const $targetModal = $("#partnershipStep3Modal");
    const count = parseInt($targetModal.find("#partnerCount").val()) || 0;
    const total = $targetModal.find("#partnerAccordionContainer .partner-accordion").length;
    const saved = $targetModal.find("#partnerAccordionContainer .partner-accordion.saved").length;

    return count >= 2 && count <= 20 && total === count && saved === count;
  }

  function checkAllPartnersSaved() {
    const isValid = validatePartnershipStep3();
    const $targetModal = $("#partnershipStep3Modal");
    const $nextBtn = $targetModal.find("#partnershipStep3NextBtn, #step3NextBtn");
    const $saveExitBtn = $targetModal.find("#partnershipSaveExitBtn, .saveExitBtn");

    if (isValid) {
      $nextBtn
        .prop("disabled", false)
        .addClass("btn-enabled")
        .removeClass("btn-disabled");
      $saveExitBtn.removeClass("disabled-link").addClass("active");
    } else {
      $nextBtn
        .prop("disabled", true)
        .addClass("btn-disabled")
        .removeClass("btn-enabled");
      $saveExitBtn.addClass("disabled-link").removeClass("active");
    }
  }

  // ==========================================================================
  // PARTNER COUNT LISTENER
  // ==========================================================================
  $(document).on("input change", "#partnerCount", function () {
    let count = parseInt($(this).val()) || 0;
    const $container = $("#partnerAccordionContainer");
    let $errorDiv = $(this).siblings(".error-step3-handle");

    if (!$errorDiv.length) {
      $errorDiv = $(
        '<div class="error-step3-handle" style="display: none"><i class="material-icons">info</i><p>Please enter at least 2 partners.</p></div>'
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

    if (count > 20) {
      count = 20;
      $(this).val(20);
    }

    if (count < 2) {
      $container.empty();
      checkAllPartnersSaved();
      return;
    }

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

    checkAllPartnersSaved();
  });

  $(document).on("focus", "#partnerCount", function () {
    $(this).siblings(".error-step3-handle").hide();
    $(this).removeClass("is-error");
  });

  // ==========================================================================
  // ACCORDION HEADER TOGGLE
  // ==========================================================================
  $(document).on("click", "#partnershipStep3Modal .partner-accordion-header", function (e) {
    e.stopPropagation();
    const $currentAccordion = $(this).closest(".partner-accordion");
    if ($currentAccordion.hasClass("saved")) return;

    const $currentContent = $currentAccordion.find(".partner-accordion-content");
    const isVisible = $currentContent.is(":visible");

    // Close other open accordions
    $("#partnershipStep3Modal .partner-accordion")
      .not($currentAccordion)
      .not(".saved")
      .each(function () {
        $(this).removeClass("active");
        $(this).find(".partner-accordion-content").slideUp(200);
        $(this).find(".partner-accordion-header i.material-icons").text("expand_more");
      });

    if (isVisible) {
      $currentAccordion.removeClass("active");
      $currentContent.slideUp(200);
      $(this).find("i.material-icons").text("expand_more");
    } else {
      $currentAccordion.addClass("active");
      $currentContent.slideDown(200);
      $(this).find("i.material-icons").text("expand_less");
      updateValidationState($currentAccordion);
    }
  });

  // Dynamic input validation listener
  $(document).on(
    "input change",
    "#partnershipStep3Modal .partner-accordion-content input, #partnershipStep3Modal .partner-accordion-content select",
    function () {
      const $accordion = $(this).closest(".partner-accordion");
      if ($accordion.length && !$accordion.hasClass("saved")) {
        updateValidationState($accordion);
      }
    }
  );

  // ==========================================================================
  // SAVE, EDIT & RESET PARTNER ACCORDION
  // ==========================================================================
  // SAVE
  $(document).on("click", "#partnershipStep3Modal .partner-save-btn", function (e) {
    e.preventDefault();
    e.stopPropagation();

    const $accordion = $(this).closest(".partner-accordion");
    const num = $accordion.data("partner");
    const $content = $accordion.find(".partner-accordion-content");

    const title = $content.find(".proprietor-gender .selected-option").first().text().trim() || "Mr.";
    const firstName = $content.find('.partner-first-name, input[placeholder="Enter first name"]').val().trim();
    const middleName = $content.find('.partner-middle-name, input[placeholder="Enter middle name"]').val().trim();
    const lastName = $content.find('.partner-last-name, input[placeholder="Enter last name"]').val().trim();
    const fullName = (title + " " + firstName + (middleName ? " " + middleName : "") + " " + lastName).trim();

    let mobile = $content.find('.partner-mobile, input[placeholder="10 digit mobile number"]').val().trim();
    if (mobile && !mobile.startsWith("+91")) mobile = "+91 " + mobile.replace(/\D/g, "");

    const email = $content.find('.partner-email, input[placeholder="Enter ID"]').val().trim();
    const pan = $content.find('.partner-pan, input[placeholder="Enter PAN"]').val().trim().toUpperCase();
    const ownership = $content.find('.partner-ownership, input.ownership-input, input[placeholder="0"]').val().trim();

    const genderEls = $content.find(".proprietor-gender-section .selected-option");
    const gender = genderEls.length ? genderEls.eq(0).text().trim() : ($content.find(".partner-gender").val() || "");
    const dob = $content.find('.partner-dob, .dobDate, input[type="date"]').val() || "";

    const community = genderEls.length > 1 ? genderEls.eq(1).text().trim() : ($content.find(".partner-community").val() || "");
    const category = genderEls.length > 2 ? genderEls.eq(2).text().trim() : ($content.find(".partner-category").val() || "");

    const address = $content.find('.partner-address, input[placeholder="Enter address"]').val().trim();
    const pincode = $content.find('.partner-pincode, input.pincode-input, input[placeholder="Enter pin code"]').val().trim();
    const city = $content.find(".cityCustomSelect .selected-option").text().trim();
    const state = $content.find(".partner-state, .state-input").val().trim();

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
      .append('<span class="partner-edit-btn"><i class="material-icons">edit</i> Edit</span>');

    $accordion.find(".partner-accordion-header").after(summaryHtml);
    $accordion.addClass("saved").removeClass("active");
    $content.slideUp(200);

    checkAllPartnersSaved();
  });

  // EDIT
  $(document).on("click", "#partnershipStep3Modal .partner-edit-btn", function (e) {
    e.preventDefault();
    e.stopPropagation();

    const $accordion = $(this).closest(".partner-accordion");
    $accordion.find(".partner-summary").remove();
    $accordion.find(".partner-edit-btn").remove();
    $accordion.find(".partner-accordion-header i.material-icons").show().text("expand_less");

    $accordion.removeClass("saved").addClass("active");
    $accordion.find(".partner-accordion-content").slideDown(200);

    updateValidationState($accordion);
    checkAllPartnersSaved();
  });

  // RESET
  $(document).on("click", "#partnershipStep3Modal .partner-reset-btn", function (e) {
    e.preventDefault();
    e.stopPropagation();

    const $accordion = $(this).closest(".partner-accordion");
    $accordion.find("input").val("").removeClass("is-error is-success");
    $accordion.find("select").val("");
    $accordion.find(".error-step3-handle").hide();
    $accordion.find(".cityAddressBlock").hide();

    $accordion.find(".custom-select-wrapper").each(function () {
      const $wrap = $(this);
      const isGender = $wrap.closest(".proprietor-gender-section").find("label").text().includes("Gender");
      const isCommunity = $wrap.closest(".proprietor-gender-section").find("label").text().includes("Community");
      const isCategory = $wrap.closest(".proprietor-gender-section").find("label").text().includes("Category");
      const isTitle = $wrap.closest(".proprietor-gender").length;

      if (isTitle) {
        $wrap.find(".selected-option").text("Mr.");
        $wrap.siblings("select").val("mr");
      } else if (isGender) {
        $wrap.find(".selected-option").text("Select gender");
        $wrap.siblings("select").val("");
      } else if (isCommunity) {
        $wrap.find(".selected-option").text("Select community");
        $wrap.siblings("select").val("");
      } else if (isCategory) {
        $wrap.find(".selected-option").text("Select category");
        $wrap.siblings("select").val("");
      } else {
        $wrap.find(".selected-option").text("Select");
        $wrap.siblings("select").val("");
      }
    });

    updateValidationState($accordion);
  });

  // ==========================================================================
  // INITIALIZATION ON READY
  // ==========================================================================
  function resetPartnershipStep3Form() {
    const $targetModal = $("#partnershipStep3Modal");
    $targetModal.find("#partnerCount").val("");
    $targetModal.find("#partnerAccordionContainer").empty();
    $targetModal.find(".error-step3-handle").hide();
    checkAllPartnersSaved();
  }

  $(document).ready(function () {
    checkAllPartnersSaved();
  });

  // ==========================================================================
  // PUBLIC API EXPOSITION
  // ==========================================================================
  window.partnershipStep3 = {
    open: openPartnershipStep3Modal,
    close: closePartnershipStep3Modal,
    reset: resetPartnershipStep3Form,
    validate: validatePartnershipStep3,
    checkSaved: checkAllPartnersSaved,
  };

})(jQuery);
