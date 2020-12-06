$(() => {
  if (typeof DataTable !== 'undefined') {
    var table = $('.orders').DataTable();
  }

  $('html').css({ 'scrollbar-width': 'none' });
  $('.nav-placeholder').remove();

  const update = () => {
    const windowDims = {
      width: $(window).width(),
      height: $(window).height(),
    };
    const navHeight = windowDims.width < 768 ? 47 : 56;

    $('html').css({ height: `${windowDims.height}px` });
    $('#scroll').css({ height: `${windowDims.height - navHeight}px` });
  };
  update();
  $(window).on('resize orientationchange', update);

  $('.orders tbody tr').on('click', function (e) {
    if (e.target.type == 'checkbox') {
      e.stopPropagation();
    } else {
      window.location = '/gallery/order?id=' + $(this).data('id');
    }
  });

  $('#pending-shipped').on('click', function () {
    let orders = [];
    $('#pending input:checked').each(function () {
      orders.push($(this).parent().parent().data('id'));
    });

    $.ajax({
      url: '/gallery/mark_shipped',
      traditional: true,
      data: {
        csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
        orders: orders,
      },
      type: 'POST',
      success: function (data) {
        if (data.success) {
          location.reload();
        } else {
          console.log('There was an error.');
        }
      },
    });
  });

  $('#pending-delete').on('click', function () {
    let orders = [];
    $('#pending input:checked').each(function () {
      orders.push($(this).parent().parent().data('id'));
    });

    $.ajax({
      url: '/gallery/delete_sales',
      traditional: true,
      data: {
        csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
        orders: orders,
      },
      type: 'POST',
      success: function () {
        location.reload();
      },
    });
  });

  $('#shipped-delete').on('click', function () {
    let orders = [];
    $('#shipped input:checked').each(function () {
      orders.push($(this).parent().parent().data('id'));
    });

    $.ajax({
      url: '/gallery/delete_sales',
      traditional: true,
      data: {
        csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
        orders: orders,
      },
      type: 'POST',
      success: function () {
        location.reload();
      },
    });
  });
});
