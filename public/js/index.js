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
