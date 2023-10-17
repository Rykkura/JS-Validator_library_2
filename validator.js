function Validator(formSelector) {
    var formRules = {};
    var _this = this;
    function getParent(element, selector) {
        while (element.parentElement) {
            if (element.parentElement.matches(selector)) {
                return element.parentElement;
            }
            element = element.parentElement;
        }
    }

    var validatorRules = {
        required: (value) => {
            return value ? undefined : "Vui lòng nhập trường này";
        },
        email: (value) => {
            var regex = /^[\w\-\.]+@([\w-]+\.)+[\w-]{2,}$/gm;
            return regex.test(value) ? undefined : "Vui lòng nhập email";
        },
        min: (min) => {
            return (value) => {
                return value.length >= min
                    ? undefined
                    : `Vui lòng nhập đủ ${min} ký tự`;
            };
        },
    };
    //lấy ra form element trong DOM theo 'formSelector'
    var formElement = document.querySelector(formSelector);
    if (formElement) {
        var inputs = formElement.querySelectorAll("[name][rules]");
        for (var input of inputs) {
            var rules = input.getAttribute("rules").split("|");
            for (var rule of rules) {
                var isRuleHasValue = rule.includes(":");
                var ruleInfo;
                if (isRuleHasValue) {
                    ruleInfo = rule.split(":");
                    rule = ruleInfo[0];
                }
                var ruleFunc = validatorRules[rule];
                if (isRuleHasValue) {
                    ruleFunc = ruleFunc(ruleInfo[1]);
                }
                // console.log(rule);
                if (Array.isArray(formRules[input.name])) {
                    formRules[input.name].push(ruleFunc);
                } else {
                    formRules[input.name] = [ruleFunc];
                }
            }
            //lắng nghe sự kiện để validate
            input.onblur = handleValidate;
            input.oninput = handleClearError;
        }
        //hàm thực hiện validate
        function handleValidate(e) {
            var rules = formRules[e.target.name];
            var errorMessage;
            for (var rule of rules) {
                errorMessage = rule(e.target.value);
                if (errorMessage) break;
            }

            //nếu có lỗi thì hiển thị ra ui
            if (errorMessage) {
                var formGroup = getParent(e.target, ".form-group");
                if (formGroup) {
                    formGroup.classList.add("invalid");
                    var formMessage = formGroup.querySelector(".form-message");
                    if (formMessage) {
                        formMessage.innerText = errorMessage;
                    }
                }
            }
            return !errorMessage;
        }

        function handleClearError(e) {
            var formGroup = getParent(e.target, ".form-group");
            if (formGroup.classList.contains("invalid")) {
                formGroup.classList.remove("invalid");
                var formMessage = formGroup.querySelector(".form-message");
                if (formMessage) {
                    formMessage.innerText = "";
                }
            }
        }
    }
    //xử lý hành vi submit form
    formElement.onsubmit = function (e) {
        e.preventDefault();
        var inputs = formElement.querySelectorAll("[name][rules]");
        var isValid = true;
        for (var input of inputs) {
            if (!handleValidate({ target: input })) {
                isValid = false;
            }
        }

        //khi không có lỗi thì submit form
        if (isValid) {
            if (typeof _this.onSubmit === "function") {
                var enableInputs = formElement.querySelectorAll(
                    "[name]:not([disable])"
                );
                var formValues = Array.from(enableInputs).reduce(
                    (values, input) => {
                        switch (input.type) {
                            case "radio":
                                values[input.name] = formElement.querySelector(
                                    'input[name="' + input.name + '"]:checked'
                                ).value;
                                break;
                            case "checkbox":
                                if (!input.matches(":checked")) {
                                    values[input.name] = "";
                                    return values;
                                }
                                if (!Array.isArray(values[input.name])) {
                                    values[input.name] = [];
                                }
                                values[input.name].push(input.value);
                                break;
                            case "file":
                                values[input.name] = input.files;
                                break;
                            default:
                                values[input.name] = input.value;
                        }
                        return values;
                    },
                    {}
                );
                _this.onSubmit(formValues);
            } else {
                formElement.submit();
            }
        }
    };
    console.log(formRules);
}
