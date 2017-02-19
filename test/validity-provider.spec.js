'use strict';

describe('validity', function() {
  var validityProvider;

  beforeEach(module('ttValidity'));

  beforeEach(inject(function(validity) {
    validityProvider = validity;
  }));

  it('validityProvider should exist', function() {
    expect(validityProvider).toBeDefined();
  });

  describe('callbacks function', function() {
    it('should exist', function() {
      expect(validityProvider.callbacks).toBeDefined();
    });

    it('should not return validityProvider', function() {
      var callbacks = validityProvider.callbacks();
      expect(callbacks).not.toEqual(validityProvider);
      expect(callbacks).toBeDefined(callbacks.valid);
      expect(callbacks).toBeDefined(callbacks.invalid);
    });

    it('should return validityProvider', function() {
      var result = validityProvider.callbacks({foo: 'bar'});
      expect(result).toEqual(validityProvider);
    });
  });

  describe('options function', function() {
    it('should exist', function() {
      expect(validityProvider.options).toBeDefined();
    });

    it('should not return validityProvider', function() {
      var result = validityProvider.options();
      expect(result).not.toEqual(validityProvider);
    });

    it('should return validityProvider', function() {
      var result = validityProvider.options({});
      expect(result).toEqual(validityProvider);
    });
  });

  // describe('reset function', function() {
  //   it('should exist', function() {
  //     expect(validityProvider.reset).toBeDefined();
  //   });
  //
  //   it('should return validityProvider', function() {
  //     var result = validityProvider.reset({});
  //     expect(result).toEqual(validityProvider);
  //   });
  // });
});
