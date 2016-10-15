'use strict';

//Activate Tooltips with bootstrap and by jquery
$(function () {
  $('[data-toggle="tooltip"]').tooltip()
})

// Declare app level module which depends on filters, and services
var app = angular.module('myApp', ['myApp.services', 'myApp.controllers', 'ngCookies']);
