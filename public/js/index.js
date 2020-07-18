
$(document).ready(function() {
  $('.carousel').slick({
    slidesToShow: 3,
    arrows: true,
    autoplay: true,
    autoplaySpeed: 1800,
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
    nextArrow: ".slick-next",
    prevArrow: ".slick-prev",
  });
});

function register() {
  $("#registerModalEmail").val($("#front-email").val());
  $("#registerModalPassowrd").val($("#front-password").val());
  show('registerModal');
}
