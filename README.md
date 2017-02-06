# Angular-Validity

[![GitHub version](https://badge.fury.io/gh/2Toad%2FAngular-Validity.svg)](https://badge.fury.io/gh/2Toad%2FAngular-Validity)
[![Dependency Status](https://david-dm.org/2Toad/Angular-Validity.svg)](https://david-dm.org/2Toad/Angular-Validity)
[![Code Climate](https://codeclimate.com/github/2Toad/Angular-Validity/badges/gpa.svg)](https://codeclimate.com/github/2Toad/Angular-Validity)
[![Downloads](https://img.shields.io/npm/dm/angular-validity.svg)](https://www.npmjs.com/package/angular-validity)
[![Join the chat at https://gitter.im/2Toad/Angular-Validity](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/2Toad/Angular-Validity?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Asynchronous validation for Angular applications

---

* [About](https://angular-validity.readme.io/v1.3.0/docs/welcome)
* [Getting Started](https://angular-validity.readme.io/v1.3.0/docs/getting-started)
* [Demos](https://angular-validity.readme.io/v1.3.0/docs/demos)

## Quick Start

> AngularJS ~1.5 is required

*If you require AngularJS ~1.4, use [Angular-Validity v1.2](https://github.com/2Toad/Angular-Validity/tree/v1.2.0)*

### Installation

Install with NPM:

`npm install angular-validity`

or with Bower:

`bower install angular-validity`

#### Add module reference

```js
var exampleApp = angular.module("exampleApp", ["ttValidity"]);
```

##### CommonJS

If you're using CommonJS (e.g., Browserify, webpack), you can do something like:

```js
require("angular-validity");
var exampleApp = angular.module("exampleApp", ["ttValidity"]);
```

### Configuration

Set global [options](https://angular-validity.readme.io/v1.3.0/docs/options) for Angular-Validity within your app module's config. In this example, we're configuring Angular-Validity to use the Bootstrap 3 `style` option:

```js
exampleApp.config(["validityProvider", function (validityProvider) {
    validityProvider.options({
        style: "Bootstrap3"
    });
}]);
```

### View

Add a [validity](https://angular-validity.readme.io/v1.3.0/docs/validity) directive to the input elements you want to validate, and specify the validation [rules](https://angular-validity.readme.io/v1.3.0/docs/rules) you want to use. In this example, the "required" and "email" rules are being added to the email input:

```html
<section ng-controller="ExampleCtrl">
    <form name="form" ng-submit="example(form)" autocomplete="off">
        <label for="email">Email</label>
        <input type="text" name="email" ng-model="email"
            validity="required email" />
        <button type="submit">Submit</button>
    </form>
</section>
```

Add a `validity-message` to the input for each of the rules you added, to define the validation message that should be used when the rule fails:

```html
<section ng-controller="ExampleCtrl">
    <form name="form" ng-submit="example(form)" autocomplete="off">
        <label for="email">Email</label>
        <input type="text" name="email" ng-model="email"
            validity="required email"
            validity-message-required="Your email address is required"
            validity-message-email="Please enter a valid email address" />
        <button type="submit">Submit</button>
    </form>
</section>
```

Add a [validity-label](https://angular-validity.readme.io/v1.3.0/docs/validity-label) directive to the form, and configure it to display validation messages for the email input:

```html
<section ng-controller="ExampleCtrl">
    <form name="form" ng-submit="example(form)" autocomplete="off">
        <label for="email">Email</label>
        <input type="text" name="email" ng-model="email"
            validity="required email"
            validity-message-required="Your email address is required"
            validity-message-email="Please enter a valid email address" />
        <validity-label for="email"></validity-label>
        <button type="submit">Submit</button>
    </form>
</section>
```

### Controller

Add a `validity` module reference to the controller:

```js
exampleApp.controller("ExampleCtrl", ["$scope", "validity",
    function ($scope, validity) {

    }
]);
```

Call the [validate](https://angular-validity.readme.io/v1.3.0/docs/validate) function and pass in the `form` you want to validate. In this example, we've added a function called `example` and an ng-submit that calls it when the form is submitted.

```js
exampleApp.controller("ExampleCtrl", ["$scope", "validity",
    function ($scope, validity) {    
        $scope.example = function (form) {
            validity.validate(form);
        };
    }
]);
```

The `validate` function returns an [AngularJS promise](https://docs.angularjs.org/api/ng/service/$q#the-promise-api). Let's add a success callback to the deferred task. This callback will be called when the entire form is valid:

```js
exampleApp.controller("ExampleCtrl", ["$scope", "validity",
    function ($scope, validity) {    
        $scope.example = function (form) {
            validity.validate(form).then(function () {
                // Form is valid. Do something...
                alert("Success!");
            });
        };
    }
]);
```

### Putting it all together

[Here's a working demo on JSFiddle](https://jsfiddle.net/2Toad/h7L6hcog/light/) of what we just put together, complete with Bootstrap 3 styling. Take it for a spin, view the HTML and JavaScript, and then fiddle around with the source.
