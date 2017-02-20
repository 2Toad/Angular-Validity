'use strict';

var helpers = require('./helpers');

describe('validity', function() {
  var validityProvider,
    $scope;

  beforeEach(angular.mock.module('ttValidity'));

  beforeEach(inject(function($compile, $rootScope, validity) {
    validityProvider = validity;

    $scope = $rootScope.$new();
    $scope.el = {};
    $scope.model = {};

    $scope.el.email = angular.element('<input name="email" ng-model="model.email" required />');
    $scope.el.form = angular.element('<form name="form"></form>');
    $scope.el.form.append($scope.el.email);

    $compile($scope.el.form)($scope);
  }));

  it('provider should exist', function() {
    expect(validityProvider).toBeDefined();
  });

  describe('callbacks function', function() {
    it('should exist', function() {
      expect(validityProvider.callbacks).toBeDefined();
    });

    it('should return callbacks', function() {
      var callbacks = validityProvider.callbacks();
      expect(callbacks).not.toEqual(validityProvider);
      expect(callbacks).toBeDefined(callbacks.valid);
      expect(callbacks).toBeDefined(callbacks.invalid);
    });

    it('should return validity provider', function() {
      var result = validityProvider.callbacks({});
      expect(result).toEqual(validityProvider);
    });
  });

  describe('options function', function() {
    it('should exist', function() {
      expect(validityProvider.options).toBeDefined();
    });

    it('should return options', function() {
      var options = validityProvider.options();
      expect(options).not.toEqual(validityProvider);
      expect(options).toBeDefined(options.cache);
      expect(options).toBeDefined(options.debug);
      expect(options).toBeDefined(options.event);
      expect(options).toBeDefined(options.style);
    });

    it('should return validity provider', function() {
      var result = validityProvider.options({});
      expect(result).toEqual(validityProvider);
    });
  });

  describe('reset function', function() {
    it('should exist', function() {
      expect(validityProvider.reset).toBeDefined();
    });

    it('should return validity provider', function() {
      var result = validityProvider.reset($scope.form);
      expect(result).toEqual(validityProvider);
    });

    it('should set form to pristine', function() {
      helpers.dirtifyForm($scope);

      validityProvider.reset($scope.form);
      helpers.updateScope($scope);

      expect($scope.form.$pristine).toBe(true);
      expect($scope.form.$dirty).toBe(false);
      expect($scope.form.$submitted).toBe(false);
      expect($scope.el.form.hasClass('ng-pristine')).toBe(true);
      expect($scope.el.form.hasClass('ng-dirty')).toBe(false);
      expect($scope.el.form.hasClass('ng-submitted')).toBe(false);

      expect($scope.form.email.$pristine).toBe(true);
      expect($scope.form.email.$dirty).toBe(false);
      expect($scope.el.email.hasClass('ng-pristine')).toBe(true);
      expect($scope.el.email.hasClass('ng-dirty')).toBe(false);
    });

    it('should set form to untouched', function() {
      helpers.dirtifyForm($scope);

      validityProvider.reset($scope.form);
      helpers.updateScope($scope);

      expect($scope.form.email.$touched).toBe(false);
      expect($scope.el.email.hasClass('ng-untouched')).toBe(true);
      expect($scope.el.email.hasClass('ng-touched')).toBe(false);
    });
  });
});
