/*
 * Angular-Validity
 * Copyright (c)2015 2Toad, LLC
 * https://github.com/2Toad/Angular-Validity
 *
 * Version: 1.0.0
 * License: MIT
 */

(function () {
    "use strict";

    angular.module("ttValidity", ["validityProvider", "validityDirective", "validityLabelDirective",
        "validityToggleDirective"
    ]);
}());

(function () {
    "use strict";

    angular.module("validityProvider", [])

    .provider("validity", function () {
        var $q,
            model = getProviderModel();

        function initialize($injector) {
            $q = $injector.get("$q");
        }

        this.$get = ["$injector",
            function ($injector) {
                initialize($injector);

                return {
                    callbacks: this.callbacks,
                    options: this.options,
                    reset: this.reset,
                    rules: this.rules,
                    state: this.state,
                    validate: this.validate
                };
            }
        ];

        this.callbacks = function (config) {
            if (!config) return model.callbacks;

            angular.merge(model.callbacks, config);
            return this;
        }

        this.options = function (config) {
            if (!config) return model.options;

            angular.merge(model.options, config);
            return this;
        }

        this.reset = function (form) {
            form.$setPristine();
            form.$setUntouched();

            var controls = model.controls[form.$vid];
            angular.forEach(controls, function (control) {
                var rules = getControlRules(control);
                resetControl(control, rules);
            });

            return this;
        }

        this.rules = function (config) {
            if (!config) return model.rules;

            angular.merge(model.rules, config);
            return this;
        }

        this.state = function (form) {
            var controls = form && model.controls[form.$vid];
            return !controls ? "unvalidated" : getState(controls, form.$submitted);

            function getState(controls, submitted) {
                var untouched = 0,
                    touched = 0,
                    invalid = 0;

                for (var vid in controls) {
                    var control = controls[vid];
                    control.$untouched ? untouched++ : touched++;
                    control.$invalid && invalid++;
                }

                return !submitted && (!touched && "unvalidated" || untouched && "partial")
                    || invalid && "invalid"
                    || "valid";
            }
        }

        this.validate = function (form, control) {
            var controls = getValidityControls(form, control),
                validationTests = [];

            angular.forEach(controls, function (control) {
                var rules = getControlRules(control);

                // TODO: refactoring to set state at the individual promise level
                // would be more performant
                resetControl(control, rules);

                validationTests.push({
                    control: control,
                    validate: validateRules(control, rules)
                });
            });

            return $q.all(validationTests.map(function (vt) {
                return vt.validate.then(
                    function (rules) { return valid(form, vt.control, rules); },
                    function (rule) { return invalid(form, vt.control, rule); }
                );
            }));

            function validateRules(control, rules) {
                var tests = [],
                    requiredTest;

                rules.forEach(function (rule) {
                    var rv = rule.split("=");
                    var test = validateRule(control, rv[0], rv[1]);
                    requiredTest || rv[0] !== "required" ? tests.push(test) : requiredTest = test;
                });

                return $q.when(requiredTest).then(executeRemainingTests);

                function validateRule(control, rule, arg) {
                    var test = model.rules[rule];

                    switch (test && test.constructor || undefined) {
                        case Function: return promisify(test(control.$viewValue, arg), rule);
                        case RegExp: return test.test(control.$viewValue) && $q.when(rule) || $q.reject(rule);
                        default:
                            console.error("Angular-Validity - Error: undefined rule", rule, control.$element);
                            return $q.reject();
                    }

                    function promisify(result, rule) {
                        var deferred = $q.defer();

                        angular.isFunction(result.then)
                            ? result.then(
                                    function () { deferred.resolve(rule); },
                                    function () { deferred.reject(rule); }
                                )
                            : result && deferred.resolve(rule) || deferred.reject(rule)

                        return deferred.promise;
                    }
                }

                function executeRemainingTests(required) {
                    return $q.all(tests).then(function (rules) {
                        return required && rules.concat(required) || rules;
                    })
                }
            }

            function valid(form, control, rules) {
                rules.forEach(function (rule) {
                    control.$setValidity(rule, true);
                    showToggle(control, rule);
                    showTarget(control, rule);

                    model.options.debug && console.info("Angular-Validity - Info: valid", control.$name, rule);
                });

                showLabel(control);
                applyStyle(control, "valid");

                model.callbacks.valid && model.callbacks.valid(control);

                return $q.when();
            }

            function invalid(form, control, rule) {
                control.$setValidity(rule, false);

                showLabel(control, rule);
                showToggle(control, rule, true);
                showTarget(control, rule, true);
                applyStyle(control, "invalid");

                model.callbacks.invalid && model.callbacks.invalid(control);

                model.options.debug && console.info("Angular-Validity - Info: invalid", control.$name, rule);

                return $q.reject();
            }
        }

        function getProviderModel() {
            return {
                callbacks: {
                    valid: null,
                    invalid: null
                },
                controls: {},
                options: {
                    cache: true,
                    debug: false,
                    event: "blur",
                    style: null
                },
                rules: getValidationRules()
            }

            function getValidationRules() {
                return {
                    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    max: function (value, max) {
                        return typeof value === "number"
                            ? value <= max
                            : typeof value !== "string" || value.length <= max;
                    },
                    min: function (value, min) {
                        return typeof value === "number"
                            ? value >= min
                            : typeof value !== "string" || value.length >= min;
                    },
                    number: /^\d+$/,
                    required: function (value) {
                        return !!value;
                    }
                };
            }
        }

        function getControlRules(control) {
            return control.$element.attr("validity").split(" ");
        }

        function resetControl(control, rules) {
            rules.forEach(function (rule) {
                control.$setPristine();
                control.$setValidity(rule, true);
                showToggle(control, rule);
                showTarget(control, rule);
            });

            showLabel(control);
            applyStyle(control, "reset");
        }

        function showToggle(control, rule, display) {
            var $element = control.$validityToggles[rule];
            $element && $element.toggle(display || false);
        }

        function showTarget(control, rule, display) {
            var target = control.$element.attr("validity-target-" + rule);
            target && $(target).toggle(display || false);
        }

        function showLabel(control, rule) {
            if (!control.$validityLabel) return;

            if (!rule) control.$validityLabel.hide();
            else {
                var message = control.$element.attr("validity-message-" + rule);
                message && control.$validityLabel.html(message).show();
            }
        }

        function applyStyle(control, state) {
            if (!model.options.style) return;

            switch (model.options.style) {
                case "Bootstrap3": return bootstrap3(control, state);
                default: return console.error("Angular-Validity - Error: invalid style", model.options.style);
            }

            function bootstrap3(control, state) {
                var formGroup = control.$element.parents(".form-group:first");

                switch (state) {
                    case "valid": return formGroup.removeClass("has-error").addClass("has-success");
                    case "invalid": return formGroup.removeClass("has-success").addClass("has-error");
                    case "reset": return formGroup.removeClass("has-error").removeClass("has-success");
                        return console.error("Angular-Validity - Error: invalid state", state);
                }
            }
        }

        function getValidityControls(form, control) {
            var controls = model.options.cache && model.controls[form.$vid] || cacheControls(form);

            return control ? [controls[control.$vid]] : controls;

            function cacheControls(form) {
                var $elements = $("form[vid=" + form.$vid + "] [vid]"),
                    controls = {};

                for (var i in form) {
                    if (form.hasOwnProperty(i) && i[0] !== "$") {
                        var control = form[i];
                        control.$element = $elements.filter($("[vid=" + control.$vid + "]"));
                        if (control.$element[0]) controls[control.$vid] = control;
                    }
                }

                return model.controls[form.$vid] = controls;
            }
        }
    });
}());

(function () {
    "use strict";

    angular.module("validityDirective", [])

    .directive("validity", ["validity",
        function (validity) {
            return {
                restrict: "A",
                require: ["^form", "ngModel"],
                link: function (scope, $element, attrs, ctrls) {
                    var formCtrl = ctrls[0],
                        modelCtrl = ctrls[1],
                        options = validity.options();

                    options.debug && healthCheck($element, attrs);

                    !formCtrl.$vid && setValidityId(formCtrl, $(form));
                    setValidityId(modelCtrl, $element);
                    modelCtrl.$validityToggles = {};

                    if (attrs.validityEvent === "watch") {
                        scope.$watch(attrs.ngModel, function () {
                            !modelCtrl.$pristine && validity.validate(formCtrl, modelCtrl);
                        });
                    } else {
                        var event = attrs.validityEvent || options.event;

                        $element.bind(event, function () {
                            validity.validate(formCtrl, modelCtrl);
                        });
                    }
                }
            };

            function healthCheck($element, attrs) {
                !attrs.validity && console.error("Angular-Validity - Error: element is missing \"validity\" rules", $element);
                !attrs.name && console.error("Angular-Validity - Error: element is missing \"name\" attribute", $element);
            }

            function setValidityId(ctrl, $element) {
                ctrl.$vid = uuid();
                $element.attr("vid", ctrl.$vid);
            }
        }
    ]);

    function uuid() {
        var l = "0123456789abcdef",
            m = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx",
            u = "",
            i = 0,
            rb = Math.random() * 0xffffffff | 0;
        while (i++ < 36) {
            var c = m[i - 1],
                r = rb & 0xf,
                v = c == "x" ? r : (r & 0x3 | 0x8);
            u += (c == "-" || c == "4") ? c : l[v];
            rb = i % 8 == 0 ? Math.random() * 0xffffffff | 0 : rb >> 4;
        }
        return u;
    }
}());

(function () {
    "use strict";

    angular.module("validityLabelDirective", [])

    .directive("validityLabel", ["validity",
        function (validity) {
            return {
                restrict: "E",
                require: "^form",
                link: function (scope, $element, attrs, formCtrl) {
                    $element.hide();

                    var options = validity.options();
                    applyStyle($element, options.style);

                    var forControl = formCtrl[attrs.for];
                    forControl && (forControl.$validityLabel = $element);

                    options.debug && healthCheck($element, attrs, forControl);
                }
            };

            function applyStyle($element, style) {
                if (!style) return;

                switch (style) {
                    case "Bootstrap3": return $element.addClass("help-block");
                    default: return console.error("Angular-Validity - Error: invalid style", style);
                }
            }

            function healthCheck($element, attrs, forControl) {
                !attrs.for
                    ? console.error("Angular-Validity - Error: element is missing \"for\" attribute", $element)
                    : !forControl && console.error("Angular-Validity - Error: no matching element with name=\"" + attrs.for + "\" on the parent form", $element);
            }
        }
    ]);
}());

(function () {
    "use strict";

    angular.module("validityToggleDirective", [])

    .directive("validityToggle", ["validity",
        function (validity) {
            return {
                restrict: "A",
                require: "^form",
                link: function (scope, $element, attrs, formCtrl) {
                    $element.hide();

                    var forControl = formCtrl[attrs.vtFor];
                    forControl && (forControl.$validityToggles[attrs.vtRule] = $element);

                    validity.options().debug && healthCheck($element, attrs, forControl);
                }
            };

            function healthCheck($element, attrs, forControl) {
                !attrs.vtFor
                    ? console.error("Angular-Validity - Error: element is missing \"vt-for\" attribute", $element)
                    : !forControl && console.error("Angular-Validity - Error: no matching element with name=\"" + attrs.vtFor + "\" on the parent form", $element);
                !attrs.vtRule && console.error("Angular-Validity - Error: element is missing \"vt-rule\" attribute", $element);
            }
        }
    ]);
}());
