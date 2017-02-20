'use strict';

function assert(test, message) {
  if (!test) throw new Error('Helpers[dirtyForm]: ' + message);
}

module.exports = {
  updateScope: function($scope) {
    $scope.$digest();
  },
  dirtifyForm: function($scope) {
    $scope.form.$setDirty();
    $scope.form.$setSubmitted();
    $scope.form.email.$setDirty();
    $scope.form.email.$setTouched();
    $scope.$digest();

    assert(!$scope.form.$pristine, 'form.$pristine should be false');
    assert($scope.form.$dirty, 'form.$dirty should be true');
    assert($scope.form.$submitted, 'form.$submitted should be true');
    assert($scope.el.form.hasClass('ng-dirty'), 'form element should have class "ng-dirty"');
    assert($scope.el.form.hasClass('ng-submitted'), 'form element should have class "ng-submitted"');

    assert(!$scope.form.email.$pristine, 'email.$pristine should be false');
    assert($scope.form.email.$dirty, 'email.$dirty should be true');
    assert($scope.form.email.$touched, 'email.$touched should be true');
    assert($scope.el.email.hasClass('ng-dirty'), 'email element should have class "ng-dirty"');
    assert($scope.el.email.hasClass('ng-touched'), 'email element should have class "ng-touched"');
  }
};
