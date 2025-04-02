/*$("#editModal").on('show.bs.modal', function (e) {
    $("#templateModal").modal("hide");
});*/

$(document).ready(function () {
  //can also be wrapped with:
  //1. $(function () {...});
  //2. $(window).load(function () {...});
  //3. Or your own custom named function block.
  //It's better to wrap it.

  //Tooltip, activated by hover event
  $("body")
    .tooltip({
      selector: "[data-toggle='tooltip']",
      container: "body",
    })
    //Popover, activated by clicking
    .popover({
      selector: "[data-toggle='popover']",
      container: "body",
      html: true,
    });
  //They can be chained like the example above (when using the same selector).
});
/*-----------------------------*/

$("#dropdown").hover(
  function () {
    $(this).find(".dropdown-menu").stop(true, true).delay(200).fadeIn(500);
  },
  function () {
    $(this).find(".dropdown-menu").stop(true, true).delay(200).fadeOut(500);
  }
);
/*--------------------------------------*/
$(document).ready(function () {
  $(".scroll").click(function (event) {
    $("html,body").animate({ scrollTop: $(this.hash).offset().top }, 500);
  });
});
/*-----------------------*/

/*-------------------*/

$(document).ready(function () {
  prep_modal();
});

function prep_modal() {
  $(".modal").each(function () {
    var element = this;
    var pages = $(this).find(".modal-split");

    if (pages.length != 0) {
      pages.hide();
      pages.eq(0).show();

      var b_button = document.createElement("button");
      b_button.setAttribute("type", "button");
      b_button.setAttribute("class", "btn btn-success btn-sm");
      b_button.setAttribute("style", "display: none;");
      b_button.innerHTML = "Back";

      var n_button = document.createElement("button");
      n_button.setAttribute("type", "button");
      n_button.setAttribute("class", "btn btn-warning btn-sm");
      n_button.innerHTML = "Next";

      $(this).find(".modal-footer").append(b_button).append(n_button);

      var page_track = 0;

      $(n_button).click(function () {
        this.blur();

        if (page_track == 0) {
          $(b_button).show();
        }

        if (page_track == pages.length - 2) {
          $(n_button).text("Submit");
        }

        if (page_track == pages.length - 1) {
          $(element).find("form").submit();
        }

        if (page_track < pages.length - 1) {
          page_track++;

          pages.hide();
          pages.eq(page_track).show();
        }
      });

      $(b_button).click(function () {
        if (page_track == 1) {
          $(b_button).hide();
        }

        if (page_track == pages.length - 1) {
          $(n_button).text("Next");
        }

        if (page_track > 0) {
          page_track--;

          pages.hide();
          pages.eq(page_track).show();
        }
      });
    }
  });
}

/*toggle*/

/*-----------------------------------*/

(function ($) {
  "use strict";

  // manual carousel controls
  $(".next").click(function () {
    $(".carousel").carousel("next");
    return false;
  });
  $(".prev").click(function () {
    $(".carousel").carousel("prev");
    return false;
  });
})(jQuery);

/*-----------------------------------------------------------*/

/*range slider*/
/*$(document).ready(function() {
    $('body').bootstrapMaterialDesign();});*/

$(document).ready(function () {
  $('a[data-toggle="tab"]').on("show.bs.tab", function (e) {
    localStorage.setItem("activeTab", $(e.target).attr("href"));
  });
  var activeTab = localStorage.getItem("activeTab");
  if (activeTab) {
    $('#myTab a[href="' + activeTab + '"]').tab("show");
  }
});

/*---------------------------------*/

$(document).ready(function () {
  // Add down arrow icon for collapse element which is open by default
  $(".collapse.show").each(function () {
    $(this)
      .prev(".card-header")
      .find(".fa")
      .addClass("fa-angle-down")
      .removeClass("fa-angle-right");
  });

  // Toggle right and down arrow icon on show hide of collapse element
  $(".collapse")
    .on("show.bs.collapse", function () {
      $(this)
        .prev(".card-header")
        .find(".fa")
        .removeClass("fa-angle-right")
        .addClass("fa-angle-down");
    })
    .on("hide.bs.collapse", function () {
      $(this)
        .prev(".card-header")
        .find(".fa")
        .removeClass("fa-angle-down")
        .addClass("fa-angle-right");
    });
});

/*cart js*/
$(document).ready(function () {
  $(".toggle").click(function () {
    $(".sidebar-contact").toggleClass("active");
    $(".toggle").toggleClass("active");
  });
});

/* Set rates + misc */
var taxRate = 0.05;
var shippingRate = 15.0;
var fadeTime = 300;

/* Assign actions */
$(".product-quantity input").change(function () {
  updateQuantity(this);
});

$(".product-removal button").click(function () {
  removeItem(this);
});

/* Recalculate cart */
function recalculateCart() {
  var subtotal = 0;

  /* Sum up row totals */
  $(".product").each(function () {
    subtotal += parseFloat($(this).children(".product-line-price").text());
  });

  /* Calculate totals */
  var tax = subtotal * taxRate;
  var shipping = subtotal > 0 ? shippingRate : 0;
  var total = subtotal + tax + shipping;

  /* Update totals display */
  $(".totals-value").fadeOut(fadeTime, function () {
    $("#cart-subtotal").html(subtotal.toFixed(2));
    $("#cart-tax").html(tax.toFixed(2));
    $("#cart-shipping").html(shipping.toFixed(2));
    $("#cart-total").html(total.toFixed(2));
    if (total == 0) {
      $(".checkout").fadeOut(fadeTime);
    } else {
      $(".checkout").fadeIn(fadeTime);
    }
    $(".totals-value").fadeIn(fadeTime);
  });
}

/* Update quantity */
function updateQuantity(quantityInput) {
  /* Calculate line price */
  var productRow = $(quantityInput).parent().parent();
  var price = parseFloat(productRow.children(".product-price").text());
  var quantity = $(quantityInput).val();
  var linePrice = price * quantity;

  /* Update line price display and recalc cart totals */
  productRow.children(".product-line-price").each(function () {
    $(this).fadeOut(fadeTime, function () {
      $(this).text(linePrice.toFixed(2));
      recalculateCart();
      $(this).fadeIn(fadeTime);
    });
  });
}

/*upload*/
function readURL(input) {
  if (input.files && input.files[0]) {
    var reader = new FileReader();

    reader.onload = function (e) {
      $(".image-upload-wrap").hide();

      $(".file-upload-image").attr("src", e.target.result);
      $(".file-upload-content").show();

      $(".image-title").html(input.files[0].name);
    };

    reader.readAsDataURL(input.files[0]);
  } else {
    removeUpload();
  }
}

document.addEventListener("DOMContentLoaded", function () {
  // Function to handle view button click
  function handleViewClick(event) {
    // Get the user ID from the data attribute
    let userId = event.target.dataset.userId;

    // Get the current view count for this user
    let viewCountElement = document.getElementById(`viewCount${userId}`);
    let currentViews = parseInt(viewCountElement.innerText);

    // Increment the view count
    let newViews = currentViews + 1;
    viewCountElement.innerText = newViews;
  }

  let viewButtons = document.querySelectorAll("#viewbtnID");
  viewButtons.forEach((button) => {
    button.addEventListener("click", handleViewClick);
  });
});
