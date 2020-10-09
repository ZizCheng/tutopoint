function hideModal() {
  loginModal.classList.remove('is-active');
  registerModal.classList.remove('is-active');
  resetModal.classList.remove('is-active');
}
function show(id) {
  hideModal();
  const modal = document.getElementById(id);
  modal.classList.add('is-active');
}
