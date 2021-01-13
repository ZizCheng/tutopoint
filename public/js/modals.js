function hideModal() {
  loginModal.classList.remove('is-active');
  //reset login modal redirect to default
  $(".login-modal-redirect").val("/dashboard");
  registerModal.classList.remove('is-active');
  resetModal.classList.remove('is-active');
}
function show(id) {
  hideModal();
  if(!id) return;
  const modal = document.getElementById(id);
  modal.classList.add('is-active');
}
function showRegisterWithRedirect(redirectURL) {
  show("registerModal");
  $(".register-modal-redirect").val(redirectURL);
}
