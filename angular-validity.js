/*
 * Angular-Validity
 * Copyright (c)2015 2Toad, LLC
 * https://github.com/2Toad/Angular-Validity
 *
 * Version: 1.4.2
 * License: MIT
 */

 (function(root, factory) {
   'use strict';

   /* global define, module */
   if (typeof define === 'function' && define.amd) {
     // AMD
     define(['angular'], factory);
   } else if (typeof module === 'object' && module.exports) {
     // CommonJS
     var angular = root.angular || window.angular || require('angular'); // eslint-disable-line
     module.exports = factory(angular);
   } else {
     // Vanilla
     root.ttAngular = factory(root.angular);
   }
 }(this, function(angular) {
    'use strict';

    extendJQLite();

    angular.module('ttValidity', ['validityProvider', 'validityDirective', 'validityLabelDirective',
        'validityToggleDirective'
    ]);

    angular.module('validityProvider', [])
    .provider('validity', function() {
        var $q,
            $log,
            model = getProviderModel();

        function initialize($injector) {
            $q = $injector.get('$q');
            $log = $injector.get('$log');
        }

        this.$get = ['$injector',
            function($injector) {
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

        this.callbacks = function(config) {
            if (!config) return model.callbacks;

            angular.merge(model.callbacks, config);
            return this;
        };

        this.options = function(config) {
            if (!config) return model.options;

            angular.merge(model.options, config);
            return this;
        };

        this.reset = function(form) {
            form.$setPristine();
            form.$setUntouched();

            var controls = model.controls[form.$vid];
            angular.forEach(controls, function(control) {
                var rules = getControlRules(control);
                resetControl(control, rules);
            });

            return this;
        };

        this.rules = function(config) {
            if (!config) return model.rules;

            angular.merge(model.rules, config);
            return this;
        };

        this.state = function(form) {
            var controls = form && model.controls[form.$vid];
            return !controls ? 'unvalidated' : getState(controls, form.$submitted);

            function getState(controls, submitted) {
                var untouched = 0,
                    touched = 0,
                    invalid = 0;

                for (var vid in controls) {
                    var control = controls[vid];
                    control.$untouched ? untouched++ : touched++;
                    control.$invalid && invalid++;
                }

                return !submitted && (!touched && 'unvalidated' || untouched && 'partial')
                    || invalid && 'invalid'
                    || 'valid';
            }
        };

        this.validate = function(form, control) {
            var controls = getValidityControls(form, control),
                validationTests = [];

            angular.forEach(controls, function(control) {
                var rules = getControlRules(control);

                // TODO: refactoring to set state at the individual promise level
                // would be more performant
                resetControl(control, rules);

                validationTests.push({
                    control: control,
                    validate: validateRules(control, rules)
                });
            });

            return $q.all(validationTests.map(function(vt) {
                return vt.validate.then(
                    function(rules) { return valid(form, vt.control, rules); },
                    function(rule) { return invalid(form, vt.control, rule); }
                );
            }));

            function validateRules(control, rules) {
                var tests = [],
                    requiredTest;

                rules.forEach(function(rule) {
                    var rv = rule.split('=');
                    var test = validateRule(control, rv[0], rv[1]);
                    requiredTest || rv[0] !== 'required' ? tests.push(test) : requiredTest = test;
                });

                return $q.when(requiredTest).then(executeRemainingTests);

                function validateRule(control, rule, arg) {
                    var test = model.rules[rule];

                    switch (test && test.constructor || undefined) {
                        case Function: return promisify(test(control.$viewValue, arg, control), rule);
                        case RegExp: return test.test(control.$viewValue) && $q.when(rule) || $q.reject(rule);
                        default: throw new Error('Undefined "' + rule + '" rule on "' + control.element.name + '" element');
                    }

                    function promisify(result, rule) {
                        var deferred = $q.defer();

                        angular.isFunction(result.then)
                            ? result.then(
                                    function() { deferred.resolve(rule); },
                                    function() { deferred.reject(rule); }
                                )
                            : result && deferred.resolve(rule) || deferred.reject(rule);

                        return deferred.promise;
                    }
                }

                function executeRemainingTests(required) {
                    return $q.all(tests).then(function(rules) {
                        return required && rules.concat(required) || rules;
                    });
                }
            }

            function valid(form, control, rules) {
                rules.forEach(function(rule) {
                    control.$setValidity(rule, true);
                    showToggle(control, rule);
                    showTarget(control, rule);

                    model.options.debug && $log.info('Angular-Validity: result=valid, element=%s, rule=%s', control.$name, rule);
                });

                showLabel(control);
                applyStyle(control, 'valid');

                model.callbacks.valid && model.callbacks.valid(control);

                return $q.when();
            }

            function invalid(form, control, rule) {
                control.$setValidity(rule, false);

                showLabel(control, rule);
                showToggle(control, rule, true);
                showTarget(control, rule, true);
                applyStyle(control, 'invalid');

                model.callbacks.invalid && model.callbacks.invalid(control);

                model.options.debug && $log.info('Angular-Validity: result=invalid, element=%s, rule=%s', control.$name, rule);

                return $q.reject();
            }
        };

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
                    event: 'blur',
                    style: null
                },
                rules: getValidationRules()
            };

            function getValidationRules() {
                return {
                    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    eval: function(value, arg, control) {
                        var $element = angular.element(control.element);
                        var scope = $element.scope();
                        var expression = $element.attr('validity-eval');
                        return scope.$eval(expression);
                    },
                    max: function(value, max) {
                        return typeof value === 'number'
                            ? value <= max
                            : typeof value !== 'string' || value.length <= max;
                    },
                    min: function(value, min) {
                        return typeof value === 'number'
                            ? value >= min
                            : typeof value !== 'string' || value.length >= min;
                    },
                    number: /^\d+$/,
                    required: function(value) {
                        return !!value;
                    }
                };
            }
        }

        function getControlRules(control) {
            return angular.element(control.element)
                .attr('validity')
                .split(' ');
        }

        function resetControl(control, rules) {
            rules.forEach(function(rule) {
                control.$setPristine();
                control.$setValidity(rule, true);
                showToggle(control, rule);
                showTarget(control, rule);
            });

            showLabel(control);
            applyStyle(control, 'reset');
        }

        function showToggle(control, rule, display) {
            var $element = control.$validityToggles[rule];
            $element && $element.toggle(display || false);
        }

        function showTarget(control, rule, display) {
            var target = angular.element(control.element).attr('validity-target-' + rule);
            if (target) {
                var element = document.querySelector(target);
                element && angular.element(element).toggle(display || false);
            }
        }

        function showLabel(control, rule) {
            if (!control.$validityLabel) return;

            if (!rule) control.$validityLabel.hide();
            else {
                var message = angular.element(control.element).attr('validity-message-' + rule);
                message && control.$validityLabel.html(message).show();
            }
        }

        function applyStyle(control, state) {
            if (!model.options.style) return;

            switch (model.options.style) {
                case 'Bootstrap3': return bootstrap3(control, state);
                default: throw new Error('Unsupported style: ' + model.options.style);
            }

            function bootstrap3(control, state) {
                var $formGroup = angular.element(control.element.closest('.form-group'));

                switch (state) {
                    case 'valid': return $formGroup.removeClass('has-error').addClass('has-success');
                    case 'invalid': return $formGroup.removeClass('has-success').addClass('has-error');
                    case 'reset': return $formGroup.removeClass('has-error').removeClass('has-success');
                    default: throw new Error('Invalid state: ' + state);
                }
            }
        }

        function getValidityControls(form, control) {
            var controls = model.options.cache && model.controls[form.$vid] || cacheControls(form);

            return control ? [controls[control.$vid]] : controls;

            function cacheControls(form) {
                var formEl = document.querySelector('[vid=' + form.$vid + ']'),
                    controls = {};

                for (var i in form) {
                    if (form.hasOwnProperty(i) && i[0] !== '$') {
                        var control = form[i];
                        control.element = formEl.querySelector('[vid=' + control.$vid + ']');
                        if (control.element) controls[control.$vid] = control;
                    }
                }

                return model.controls[form.$vid] = controls;
            }
        }
    });

    angular.module('validityDirective', [])
    .directive('validity', ['validity', '$log',
        function(validity, $log) {
            return {
                restrict: 'A',
                require: ['^form', 'ngModel'],
                link: function(scope, $element, attrs, ctrls) {
                    var formEl = $element[0].form,
                        formCtrl = ctrls[0],
                        modelCtrl = ctrls[1],
                        options = validity.options();

                    options.debug && healthCheck(formCtrl, formEl, $element, attrs);

                    !formCtrl.$vid && setValidityId(formCtrl, angular.element(formEl));
                    setValidityId(modelCtrl, $element);
                    modelCtrl.$validityToggles = {};

                    if (attrs.validityEvent === 'watch') {
                        scope.$watch(attrs.ngModel, function() {
                            !modelCtrl.$pristine && validity.validate(formCtrl, modelCtrl);
                        });
                    } else {
                        var event = attrs.validityEvent || options.event;

                        $element.bind(event, function() {
                            validity.validate(formCtrl, modelCtrl);
                        });
                    }
                }
            };

            function healthCheck(formCtrl, formEl, $element, attrs) {
                !formCtrl.$name && $log.warn('Angular-Validity: form is missing "name" attribute:', formEl);
                !attrs.validity && $log.warn('Angular-Validity: element is missing "validity" rules:', $element);

                if (!attrs.name) {
                    $log.warn('Angular-Validity: element is missing "name" attribute:', $element);
                } else {
                    var elements = formEl.querySelectorAll('[name=' + attrs.name + ']');
                    elements.length > 1 && $log.warn('Angular-Validity: multiple elements have identical name attribute: "%s"', attrs.name, $element);
                }
            }

            function setValidityId(ctrl, $element) {
                ctrl.$vid = uuid();
                $element.attr('vid', ctrl.$vid);

                function uuid() {
                    var id1 = Math.random().toString(36),
                      id2 = Math.random().toString(36);
                    return 'av-' + id1.substring(2, 15) + id2.substring(2, 15);
                }
            }
        }
    ]);

    angular.module('validityLabelDirective', [])
    .directive('validityLabel', ['validity', '$log',
        function(validity, $log) {
            return {
                restrict: 'E',
                require: '^form',
                link: function(scope, $element, attrs, formCtrl) {
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
                    case 'Bootstrap3': return $element.addClass('help-block');
                    default: throw new Error('Unsupported style: ' + style);
                }
            }

            function healthCheck($element, attrs, forControl) {
                !attrs.for
                    ? $log.warn('Angular-Validity: element is missing "for" attribute: %o', $element)
                    : !forControl && $log.warn('Angular-Validity: no matching element with name="%s" on the parent form: %o', attrs.for, $element);
            }
        }
    ]);

    angular.module('validityToggleDirective', [])
    .directive('validityToggle', ['validity', '$log',
        function(validity, $log) {
            return {
                restrict: 'A',
                require: '^form',
                link: function(scope, $element, attrs, formCtrl) {
                    $element.hide();

                    var forControl = formCtrl[attrs.vtFor];
                    forControl && (forControl.$validityToggles[attrs.vtRule] = $element);

                    validity.options().debug && healthCheck($element, attrs, forControl);
                }
            };

            function healthCheck($element, attrs, forControl) {
                !attrs.vtFor
                    ? $log.warn('Angular-Validity: element is missing "vt-for" attribute: %o', $element)
                    : !forControl && $log.warn('Angular-Validity: no matching element with name="%s" on the parent form: %o', attrs.vtFor, $element);
                !attrs.vtRule && $log.warn('Angular-Validity: element is missing "vt-rule" attribute: %o', $element);
            }
        }
    ]);

    function extendJQLite() {
      angular.element.prototype.hide = function() {
        var element = this[0];
        element.jqlDisplay = element.style.display;
        element.style.display = 'none';
      };

      angular.element.prototype.show = function() {
        var element = this[0];
        element.jqlDisplay = element.jqlDisplay || 'none';
        element.style.display = element.jqlDisplay !== 'none' && element.jqlDisplay || 'block';
      };

      angular.element.prototype.toggle = function(display) {
        display ? this.show() : this.hide();
      };
    }
}));
