var search_input = $('#fsearch');
var search_window = $('#fsearch_window');
var content_frame = $('#content_frame');
var companion = $('#fsearch_companion');
var page_link = $('#pageLink');
var lis = null;
var page_top_offset = $('#main_part').offset().top;

change_page = function (pagename) {
    content_frame.attr ('src', 'monodoc.ashx?link=' + pagename);
    page_link.attr ('href', '?link=' + pagename);
    if (window.history && window.history.pushState)
        window.history.pushState (null, '', '/?link=' + pagename);
};
page_link.attr ('href', document.location.search);

var is_shown = false;

var hide_companion = function () {
	companion.hide ();
	companion.removeClass ('in');
};

var hide = function () {
	if (!is_shown)
		return;
	search_window.hide ();
	hide_companion ();
	is_shown = false;
};

var show = function () {
	if (is_shown)
		return;
	var pos = $.extend({}, search_input.offset(), {
			height: search_input[0].offsetHeight
	});
    search_window.css ({ 'width': search_input.outerWidth() + 'px', top: pos.top + pos.height + 15, left: pos.left });
	search_window.show (100);
	is_shown = true;
};

search_window.mouseleave (hide_companion);

search_input.blur (function () {
	window.setTimeout (hide, 200);
	if (search_input.val ().length == 0)
		search_input.css ('width', '19em');
});

search_input.focus (function () {
	search_input.css ('width', '29em');
	if (search_window.text().length > 0 && search_input.val().length > 0)
		show ();
	window.setTimeout (function () {
		search_input[0].select ();
	}, 10);
});

search_input.keyup (function (event) {
	if ($(this).val () == "")
		hide();

    // Only process if we receive an alnum or backspace or del
    if (event.which != 8 && event.which != 46
        && (event.which < 'A'.charCodeAt(0) || event.which > 'Z'.charCodeAt(0))
        && (event.which < '0'.charCodeAt(0) || event.which > '9'.charCodeAt(0)))
        return;

	var callback = function (data) {
		if (data == null || data.length == 0)
			return;

		var items = [];

		$.each (data, function(key, val) {
			var item = val.name;
			var url = val.url.replace (/[<>]/g, function (c) { return c == '<' ? '{' : '}'; });
			items.push('<li><a href="#" onclick="change_page(\''+url+'\')" data-title="'+(val.fulltitle == '' ? val.name : val.fulltitle)+'">' + item + '</a></li>');
		});

		search_window.html (items.join (''));
		lis = search_window.children ('li');
		lis.hover (function () {
			var childA = $(this).children('a');
			$(this).addClass ('active');
			var offset = childA.offset ();
			companion.css ({
				'top': offset.top - (companion.outerHeight () - companion.height ()) + 5,
				'right': $('html').outerWidth () - offset.left + 10
			});
			companion.children ('.tooltip-inner').text (childA.data ('title'));
			companion.addClass ('in');
			companion.show ('fast');
		}, function () {
			$(this).removeClass ('active');
		});

		show ();
	};
	$.getJSON ('monodoc.ashx?fsearch=' + $(this).val (), callback);
});

document.getElementById ('fsearch').onsearch = function () {
	if (search_input.val () == "") {
		hide ();
		search_input.blur ();
	}
};

search_input.keydown (function (event) {
	if (lis == null)
		return;
	var selected = lis.filter('.active');
	var newSelection = null;
	$('#fsearch_companion').css ('display', 'none');

	switch (event.which)
	{
	case 13: // return
		if (selected.length != 0) {
			selected.children ('a').click ();
		} else {
			// Show full search page
			content_frame.attr('src', 'search.html#' + encodeURI(search_input.val ()));
		}
		hide ();
		search_input.blur ();
		return false;
	case 38: // up
		if (selected.length != 0) {
			var prev = selected.prev ();
			newSelection = prev;
		} else {
			newSelection = lis.last ();
		}
		break;
	case 40: // down
		if (selected.length != 0) {
			var next = selected.next ();
			if (next.length != 0)
				newSelection = next;
		} else {
			newSelection = lis.first ();
		}
		break;
	}

	if (newSelection != null) {
		newSelection.addClass ('active');
		if (selected != null) {
			selected.removeClass ('active');
			selected.mouseleave();
		}
		newSelection.mouseenter();
		selected = newSelection;
	}
});
