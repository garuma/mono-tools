//
// PTree - A dynamically loaded TOC tree
//
// Author:
// 		Piers Haken (piersh@friskit.com)
//
// (C) 2003 Piers Haken
//

// TODO:
//	work out how to cancel scrolling keyboard events on Mozilla
//	better support for multiple trees in a single body

function PTree ()
{
	this.strActionBase = "";
	this.strSrcBase = "";
	this.strTargetDefault = "";
	this.eltSelected = null;
	this.onClickCallback = null;
	this.imgClassClosed = 'tree-node-closed';
	this.imgClassOpened = 'tree-node-opened';
	this.nImageWidth = 16;
	this.nImageHeight = 16;

	this.CreateItemFromXML = function (oNode, fLast, eltParent)
	{
		var strText = oNode.getAttribute ("text");
		var strAction = oNode.getAttribute ("action");
		var strSrc = oNode.getAttribute ("src");
		var strTarget = oNode.getAttribute ("target");
		return this.CreateItem (eltParent, strText, strAction, strSrc, fLast, strTarget, fLast, eltParent);
	}

	this.CreateItem = function (eltParent, strText, strAction, strSrc, fLast, strTarget)
	{
		var _this = this;

		var eltDiv = $('<div/>');
		if (eltParent == null)
			eltDiv.data ('tree_fRoot', true);

		if (fLast)
			eltDiv.data ('tree_fLast', true);

		if (strAction)
			eltDiv.data ('tree_action', strAction);

		if (strSrc != null)
			eltDiv.data ('tree_src', strSrc);

		var eltSpan = $('<span/>', { style: 'margin-left: 0px' });
		eltSpan.addClass ('tree-label');

		if (eltParent)
		{
			eltDiv.addClass ('tree-node-collapsed');

			// this node's tree icon
			var eltIcon = $('<' + this.imgTagName + '/>');
			if (strSrc)
				eltIcon.on ('click', function () { _this.LoadNode ($(this)); });
			eltIcon.addClass (this.imgClassClosed);
			eltIcon.appendTo (eltSpan);

			// parent's tree icons
			//var eltIconLast = eltIcon;
			var eltParentDiv = eltParent;
			while (!this.IsRootDiv (eltParentDiv))
			{
				eltIcon.parent ().css ('margin-left', '+=16');
				eltParentDiv = eltParentDiv.parent ('div');
			}
		}
		else
		{
			eltDiv.addClass ('tree-node');
		}

		// description
		var eltDescription;

		if (strAction)
		{
			eltDescription = $('<a/>');
			if (strAction.indexOf ('http://') === 0)
				eltDescription.attr ('href', strAction);
			else
				eltDescription.attr ('href', this.strActionBase + strAction);
			eltDescription.attr ('title', strText);
			if (strTarget)
				eltDescription.attr ('target', strTarget);
			else if (this.strTargetDefault)
				eltDescription.attr ('target', this.strTargetDefault);
			eltDescription.html (strText);
			var parent = this;
			eltDescription.click (function (e) {
				_this.SelectNode (eltDiv);
				if (parent.onClickCallback) {
					e.stopPropagation ();
					e.preventDefault ();
					parent.onClickCallback(strAction);
				}
			});
			eltDescription.mouseover (function () { this.blur (); });
			eltDescription.mouseup (function () { this.blur (); });
		}
		else
		{
			eltDescription = $('<span/>');
			eltDescription.addClass ('tree-label');
			eltDescription.html (strText);
		}

		eltSpan.append (eltDescription);
		eltDiv.append (eltSpan);

		// append this node to its parent
		if (eltParent)
			eltParent.append (eltDiv);
		else
			this.SelectNode (eltDiv);

		return eltDiv;
	}

	this.SelectNode = function (eltDiv)
	{
		if (this.IsRootDiv (eltDiv))
			return;
		if (this.eltSelected == null || !this.eltSelected.is (eltDiv)) {
			if (eltDiv) {
				var eltLabel = this.GetSpan (eltDiv);
				eltLabel.children ('a').addClass ('label label-info');
			}
			if (this.eltSelected) {
				var eltLabel = this.GetSpan (this.eltSelected);
				eltLabel.children ('a').removeClass ('label label-info');
			}
			this.eltSelected = eltDiv;
		}
	}

	this.LoadNode = function (eltIcon)
	{
		var eltDiv = this.GetDivFromIcon (eltIcon);
		eltIcon.off ('click');

		var eltLoading = this.CreateItem (eltDiv, "<img src=\"../img/searching.gif\"/>Loading...", null, null, true);
		eltLoading.attr ('class', '');
		eltLoading.find ('i').remove ();

		var url = this.strSrcBase + eltDiv.data ('tree_src');
		var _this = this;
		$.get (url, function (data) {
			var doc = data.documentElement;
			
			var children = doc.childNodes;
			var cChildren = children.length;

			for (var iNode = 0; iNode < cChildren; iNode ++)
				_this.CreateItemFromXML (children[iNode], iNode == cChildren - 1, eltDiv);

			eltLoading.remove ();

			if (_this.eltSelected == eltLoading)
				_this.SelectNode (_this.GetFirstChild (eltDiv));

			eltIcon.attr ('class', _this.GetIconClassName (eltDiv, false));
			eltDiv.attr ('class', 'tree-node');
			eltIcon.on ('click', function () { _this.onClickIcon ($(this)); });
		});
	}

	this.ExpandFromPath = function (path)
	{
		var root = $('.tree-node').first ();
		var elements = path.split('@');
		if (elements.length == 0)
			return;

		var _this = this;
		var finish = function (node, i, opened) {
			if (!opened) {
				node.attr('class', 'tree-node');
				var icon = _this.GetIconFromDiv (node);
				icon.off ('click');
				icon.attr('class', _this.GetIconClassName (node, false));
				icon.on ('click', function () { _this.onClickIcon ($(this)); });
			}
			root = node;
			if (i == elements.length - 1) {
				_this.SelectNode (node);
			}
		};
		var recurse = function (i) {
			if (i >= elements.length)
				return;
			var node = root.children ('div').eq (elements[i]);
			// Tree already loaded
			if (node.find ('div').first ().length == 0) {
				var url = _this.strSrcBase + elements.slice(0, i + 1).join('@');
				$.get (url, function (data) {
					var doc = data.documentElement;

					var children = doc.childNodes;
					var cChildren = children.length;

					for (var iNode = 0; iNode < cChildren; iNode ++)
						_this.CreateItemFromXML (children[iNode], iNode == cChildren - 1, node)

					// We finish node creation by opening up its tree like clicking would normally do
					finish (node, i, false);
					recurse (i + 1);
				});
			} else {
				finish (node, i, true);
				recurse (i + 1);
			}
		};
		recurse (0);
	}

	this.onClickIcon = function (eltIcon)
	{
		var eltDiv = this.GetDivFromIcon (eltIcon);
		var className = eltIcon.attr ('class');
		if (className == this.imgClassClosed) {
			eltDiv.attr ('class', 'tree-node');
			eltIcon.attr ('class', this.GetIconClassName (eltDiv, false));
		} else if (className == this.imgClassOpened) {
			eltDiv.attr ('class', 'tree-node-collapsed');
			eltIcon.attr ('class', this.GetIconClassName (eltDiv, true));
		}
	}

	this.onKeyDown = function (event)
	{
		var eltSelect = this.eltSelected;
		var fLast = this.IsLastDiv (eltSelect);
		var fRoot = this.IsRootDiv (eltSelect);

		switch (event.keyCode)
		{
		case 13: // return
			var eltLink = eltSelect.firstChild.lastChild;
			if (eltSelect.data ('tree_action'))
				window.open (eltLink.href, eltLink.target);
			this.SelectNode (eltSelect);
			return false;	// don't EnsureVisible

		case 38: // up
			if (!fRoot)
			{
				if (this.IsFirstChild (eltSelect))
					eltSelect = this.GetParentDiv (eltSelect);
				else
				{
					eltSelect = eltSelect.previousSibling;
					while (this.IsExpanded (eltSelect))
						eltSelect = eltSelect.lastChild;
				}
			}
			break;

		case 40: // down
			if (this.IsExpanded (eltSelect))
				eltSelect = this.GetFirstChild (eltSelect);
			else if (!fLast)
				eltSelect = eltSelect.nextSibling;
			else
			{
				while (!this.IsRootDiv (eltSelect) && this.IsLastDiv (eltSelect))
					eltSelect = this.GetParentDiv (eltSelect);

				if (this.IsRootDiv (eltSelect))
					return false;

				eltSelect = eltSelect.nextSibling;
			}
			break;

		case 37: // left
			if (!fRoot)
			{
				if (this.IsExpanded (eltSelect))
					this.onClickIcon (this.GetIconFromDiv (eltSelect));
				else
					eltSelect = this.GetParentDiv (eltSelect);
			}
			break;

		case 39: // right
			if (this.HasChildren (eltSelect))
			{
				var eltChild = this.GetFirstChild (eltSelect);
				if (this.IsExpanded (eltSelect))
					eltSelect = eltChild;
				else if (eltChild != null)
					this.onClickIcon (this.GetIconFromDiv (eltSelect));
				else
					this.LoadNode (this.GetIconFromDiv (eltSelect));
			}
			break;

		default:
			return true;
		}

		this.SelectNode (eltSelect);
		this.EnsureVisible (this.GetLabel (eltSelect));

		return false;
	}

	this.SetText = function (eltDiv, strText)
	{
		eltDiv.text (strText);
	}

	this.GetIconClassName = function (eltDiv, fPlus)
	{
		return fPlus ? this.imgClassClosed : this.imgClassOpened;
	}

	this.GetDivFromIcon = function (eltIcon)
	{
		return eltIcon.parent ('span').parent ('div');
	}

	this.GetIconFromDiv = function (eltDiv)
	{
		return eltDiv.children ('span').children (this.imgTagName + ':last')
	}

	this.GetFirstChild = function (eltDiv)
	{
		return eltDiv.children ('span').children ().first ();
	}

	this.GetSpan = function (eltDiv)
	{
		return eltDiv.children ('span');
	}

	this.GetLabel = function (eltDiv)
	{
		return eltDiv.find ('a').first ();
	}

	this.HasChildren = function (eltDiv)
	{
		return (typeof eltDiv.data ('tree_src') != 'undefined') || this.IsRootDiv (eltDiv);
	}

	this.IsLastDiv = function (eltDiv)
	{
		return typeof eltDiv.data ('tree_fLast') != 'undefined';
	}

	this.IsRootDiv = function (eltDiv)
	{
		return eltDiv.length == 0 || typeof eltDiv.data ('tree_fRoot') != 'undefined';
	}

	this.IsExpanded = function (eltDiv)
	{
		return !eltDiv.hasClass ('tree-node-collapsed');
	}

	this.IsFirstChild = function (eltDiv)
	{
		return eltDiv.prev ('div').count == 0
	}

	this.EnsureVisible = function (elt)
	{
		var x = 0;
		var y = 0;
		elt = elt[0];
		var parent = elt;
		while (parent != null)
		{
			x += parent.offsetLeft;
			y += parent.offsetTop;
			parent = parent.offsetParent;
		}

		var yView = window.frameElement.scrollTop + document.body.scrollTop;
		var dyView = document.body.clientHeight;
		var dy = 0;
		if (y + elt.offsetHeight > yView + dyView)
			dy = (y + elt.offsetHeight) - (yView + dyView);
		if (y < yView + dy)
			dy = y - yView;

		var xView = window.frameElement.scrollLeft + document.body.scrollLeft;
		var dxView = document.body.clientWidth;
		var dx = 0;
		if (x + elt.offsetWidth > xView + dxView)
			dx = (x + elt.offsetWidth) - (xView + dxView);
		if (x < xView + dx)
			dx = x - xView;

		if (dx != 0 || dy != 0)
			window.scrollBy (dx, dy);
	}
}
