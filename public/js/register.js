$("#confirmPasswordError").hide();

function checkPasswordMatch(input) {
  if (document.getElementById('registerModalPassword').value != document.getElementById('registerModalConfirmPassword').value) {
    $("#confirmPasswordError").show();
  } else {
    $("#confirmPasswordError").hide();
  }
}
