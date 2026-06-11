/**
* Template Name: Personal - v2.1.0
* Template URL: https://bootstrapmade.com/personal-free-resume-bootstrap-template/
* Author: BootstrapMade.com
* License: https://bootstrapmade.com/license/
*/
!(function($) {
  "use strict";

  // Reveal a section (or go home). Exposed so the knowledge-graph hero can
  // drive the same navigation when a node is clicked.
  function showSection(hash) {
    if (hash === '#header') { goHome(); return; }
    // only a plain "#id" is ever a valid section target; reject anything else so a
    // malformed location.hash can't reach jQuery as a selector (would throw and
    // break on-load navigation).
    if (!/^#[\w-]+$/.test(hash) || !$(hash).length) return;
    $('.nav-menu .active, .mobile-nav .active').removeClass('active');
    $('.nav-menu, .mobile-nav').find('a[href="' + hash + '"]').closest('li').addClass('active');
    document.body.classList.add('section-active');   // hides #graph-hero via CSS
    if (!$('#header').hasClass('header-top')) {
      $('#header').addClass('header-top');
      setTimeout(function() {
        $("section").removeClass('section-show');
        $(hash).addClass('section-show');
      }, 350);
    } else {
      $("section").removeClass('section-show');
      $(hash).addClass('section-show');
    }
  }
  function goHome() {
    $('#header').removeClass('header-top');
    $("section").removeClass('section-show');
    document.body.classList.remove('section-active');  // shows #graph-hero again
    $('.nav-menu .active, .mobile-nav .active').removeClass('active');
    $('.nav-menu, .mobile-nav').find('a[href="#header"]').closest('li').addClass('active');
  }
  window.showSection = showSection;
  window.goHome = goHome;

  // Nav Menu
  $(document).on('click', '.nav-menu a, .mobile-nav a', function(e) {
    if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
      var hash = this.hash;
      if (hash && $(hash).length) {
        e.preventDefault();
        showSection(hash);
        if ($('body').hasClass('mobile-nav-active')) {
          $('body').removeClass('mobile-nav-active');
          $('.mobile-nav-toggle i').toggleClass('icofont-navigation-menu icofont-close');
          $('.mobile-nav-overly').fadeOut();
        }
        return false;
      }
    }
  });

  // Activate/show sections on load with hash links — but ONLY when the knowledge-graph
  // hero is not the home surface. On desktop the graph is home, so a direct #hash must
  // not reveal a legacy section (graph-hero.js opens the matching node instead). Mobile /
  // reduced-motion keep #hash -> section as the real experience + no-JS fallback.
  var graphIsHome = !window.matchMedia('(max-width: 768px)').matches
                 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!graphIsHome && window.location.hash && $(window.location.hash).length) {
    showSection(window.location.hash);
  }

  // Mobile Navigation
  if ($('.nav-menu').length) {
    var $mobile_nav = $('.nav-menu').clone().prop({
      class: 'mobile-nav d-lg-none'
    });
    $('body').append($mobile_nav);
    $('body').prepend('<button type="button" class="mobile-nav-toggle d-lg-none"><i class="icofont-navigation-menu"></i></button>');
    $('body').append('<div class="mobile-nav-overly"></div>');

    $(document).on('click', '.mobile-nav-toggle', function(e) {
      $('body').toggleClass('mobile-nav-active');
      $('.mobile-nav-toggle i').toggleClass('icofont-navigation-menu icofont-close');
      $('.mobile-nav-overly').toggle();
    });

    $(document).click(function(e) {
      var container = $(".mobile-nav, .mobile-nav-toggle");
      if (!container.is(e.target) && container.has(e.target).length === 0) {
        if ($('body').hasClass('mobile-nav-active')) {
          $('body').removeClass('mobile-nav-active');
          $('.mobile-nav-toggle i').toggleClass('icofont-navigation-menu icofont-close');
          $('.mobile-nav-overly').fadeOut();
        }
      }
    });
  } else if ($(".mobile-nav, .mobile-nav-toggle").length) {
    $(".mobile-nav, .mobile-nav-toggle").hide();
  }

  // jQuery counterUp
  $('[data-toggle="counter-up"]').counterUp({
    delay: 10,
    time: 1000
  });

  // Skills section
  $('.skills-content').waypoint(function() {
    $('.progress .progress-bar').each(function() {
      $(this).css("width", $(this).attr("aria-valuenow") + '%');
    });
  }, {
    offset: '80%'
  });

  // Testimonials carousel (uses the Owl Carousel library)
  $(".testimonials-carousel").owlCarousel({
    autoplay: true,
    dots: true,
    loop: true,
    responsive: {
      0: {
        items: 1
      },
      768: {
        items: 2
      },
      900: {
        items: 3
      }
    }
  });

  // Porfolio isotope and filter
  $(window).on('load', function() {
    var portfolioIsotope = $('.portfolio-container').isotope({
      itemSelector: '.portfolio-item',
      layoutMode: 'fitRows'
    });

    $('#portfolio-flters li').on('click', function() {
      $("#portfolio-flters li").removeClass('filter-active');
      $(this).addClass('filter-active');

      portfolioIsotope.isotope({
        filter: $(this).data('filter')
      });
    });

  });

  // Initiate venobox (lightbox feature used in portofilo)
  $(document).ready(function() {
    $('.venobox').venobox();
  });

})(jQuery);