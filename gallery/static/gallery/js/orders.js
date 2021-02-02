const errorCallback = () =>
  alert(
    'There was an error processing your request. ' +
      'Please contact your webmaster.',
  );

$(() => {
  if (typeof DataTable !== 'undefined') {
    var table = $('.orders').DataTable();
  }

  $('.orders tbody tr').on('click', function (e) {
    if (e.target.type == 'checkbox') {
      e.stopPropagation();
    } else {
      const id = $(this).data('id');
      if (id !== undefined) {
        window.location = '/gallery/order?id=' + id;
      }
    }
  });

  $('#pending-shipped').on('click', function () {
    let orders = $('#pending input:checked')
      .map(function () {
        return $(this).parents('tr').data('id');
      })
      .toArray();

    $.ajax({
      url: '/gallery/mark_shipped',
      data: {
        csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
        orders: JSON.stringify(orders),
      },
      type: 'POST',
      success: function (data) {
        location.reload();
      },
      error: errorCallback,
    });
  });

  $('#pending-delete').on('click', function () {
    let orders = $('#pending input:checked')
      .map(function () {
        return $(this).parents('tr').data('id');
      })
      .toArray();

    $.ajax({
      url: '/gallery/delete_sales',
      data: {
        csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
        orders: JSON.stringify(orders),
      },
      type: 'POST',
      success: function () {
        location.reload();
      },
      error: errorCallback,
    });
  });

  $('#shipped-delete').on('click', function () {
    let orders = $('#shipped input:checked')
      .map(function () {
        return $(this).parents('tr').data('id');
      })
      .toArray();

    $.ajax({
      url: '/gallery/delete_sales',
      data: {
        csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
        orders: JSON.stringify(orders),
      },
      type: 'POST',
      success: function () {
        location.reload();
      },
      error: errorCallback,
    });
  });
});
