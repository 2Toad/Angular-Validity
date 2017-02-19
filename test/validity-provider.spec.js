'use strict';

describe('validity', function() {
  var provider;

  beforeEach(module('ttValidity'));

  beforeEach(inject(function(validity) {
    provider = validity;
  }));

  it('provider should exist', function() {
    expect(provider).toBeDefined();
  });
});
