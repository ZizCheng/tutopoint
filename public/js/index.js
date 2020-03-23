$(document).ready(function() {
  $('.carousel').slick({
    slidesToShow: 3,
    arrows: true,
    responsive: [
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 2,
        },
      },
      {
        breakpoint: 800,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    // You can unslick at a given breakpoint now by adding:
    // settings: "unslick"
    // instead of a settings object
    ],
  });
});

let dropdown = false;
dropdownMenu = document.getElementById('dropdownMenu');
dropdownButton = document.getElementById('dropdownButton');

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
function register() {
  show('registerModal');
  const email = document.getElementById('front-email');
  const password = document.getElementById('front-password');
  const registerModalEmail = document.getElementById('registerModalEmail');
  const registerModalPassword = document.getElementById('registerModalPassword');
  registerModalEmail.value = email.value;
  registerModalPassword.value = password.value;
}
function toggleDropdown() {
  if (dropdown) {
    dropdownMenu.classList.remove('is-active');
    dropdownButton.classList.remove('is-active');
    dropdown = false;
    return;
  }
  dropdownButton.classList.add('is-active');
  dropdownMenu.classList.add('is-active');
  dropdown = true;
}
