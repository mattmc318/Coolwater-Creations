$(document).ready(function () {
    let table = $('.orders').DataTable();

    $('.orders tbody tr').click(function (e) {
        if (e.target.type == "checkbox") {
            e.stopPropagation();
        } else {
            window.location = '/gallery/order?id=' + $(this).data('id');
        }
    });

    $('#pending-shipped').click(function () {
        let orders = [];
        $('#pending input:checked').each(function () {
            orders.push($(this).parent().parent().data('id'));
        });

        $.ajax({
            url: "/gallery/mark_shipped",
            traditional: true,
            data: {
                'csrfmiddlewaretoken': $('input[name=csrfmiddlewaretoken]').val(),
                'orders': orders,
            },
            type: 'POST',
            success: function (data) {
                if (data.success) {
                    location.reload();
                } else {
                    console.log('There was an error.');
                }
            }
        });
    });

    $('#pending-delete').click(function () {
        let orders = [];
        $('#pending input:checked').each(function () {
            orders.push($(this).parent().parent().data('id'));
        });

        $.ajax({
            url: "/gallery/delete_sales",
            traditional: true,
            data: {
                'csrfmiddlewaretoken': $('input[name=csrfmiddlewaretoken]').val(),
                'orders': orders,
            },
            type: 'POST',
            success: function () {
                location.reload();
            }
        });
    });

    $('#shipped-delete').click(function () {
        let orders = [];
        $('#shipped input:checked').each(function () {
            orders.push($(this).parent().parent().data('id'));
        });

        $.ajax({
            url: "/gallery/delete_sales",
            traditional: true,
            data: {
                'csrfmiddlewaretoken': $('input[name=csrfmiddlewaretoken]').val(),
                'orders': orders,
            },
            type: 'POST',
            success: function () {
                location.reload();
            }
        });
    });
});
