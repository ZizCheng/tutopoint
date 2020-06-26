let dropdown = true;

function toggleDropdown() {
  if (dropdown) {
    $("#dropdownMenu, #dropdownButton").removeClass('is-active');
    dropdown = false;
  }
  else {
    $("#dropdownMenu, #dropdownButton").addClass('is-active');
    dropdown = true;
  }
}
