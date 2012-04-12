define([], function()
{
    return function(original_table)
    {
        var element;
        var header;
        var body;
        var selected_rows = [];

        var last_clicked_index = 0;
        var shift_boundary_index = 0;
        var sorted_column = 0;
        var sorted_direction = 1;

        var _onRefresh = function() {};
        var _onSelect = function() {};
        var getElement = function() { return element; };
        var getHeader = function() { return header; };
        var getBody = function() { return body; };
        var getRows = function() { return body.find('tr'); };
        var onRefresh = function(fn) { _onRefresh = fn; };
        var onSelect = function(fn) { _onSelect = fn; };
        var resort = function() { sortByColumnIndex(sorted_column, sorted_direction); };
        var refresh = function(args) { _onRefresh(args); };
        var select = function(args) { _onSelect(args); };
        var getSelectedRows = function() { return selected_rows; };

        var createTableRowFromTuple = function(text_tuple)
        {
            var td;
            var tr = document.createElement('tr');
            var n_elements = text_tuple.length;
            for (var i = 0; i < n_elements; i++) {
                td = document.createElement('td');
                td.textContent = text_tuple[i];
                tr.appendChild(td);
            }
            return tr;
        };

        var populateTable = function(data)
        {
            body.children().remove();
            if (data['data'])
            {
                var row;
                var n_elements = data['data'].length
                for (var i = 0; i < n_elements; i++)
                {
                    row = createTableRowFromTuple(data['data'][i]);
                    if (data.hasOwnProperty('attrs'))
                    {
                        row.id = data['attrs'][i]['id'];
                        row.className = data['attrs'][i]['class'];
                    }
                    body.append(row);
                }
                resort();
            }
        };

        var setClickEvents = function()
        {
            var rows = getRows();
            rows.mouseup(singleselect);
            rows.mousedown(multiselect);
        };

        var compare = function(a, b)
        {
            if (a < b) { return -1; }
            else if (a == b) { return 0; }
            else { return 1; }
        };

        var updateSelectedRows = function()
        {
            selected_rows = body.find('.ui-selected');
        };

        var sortByElement = function(th_element)
        {
            var columns = header.find('th');
            var column_index = columns.index(th_element);
            var new_sorted_direction = (sorted_column == column_index) ? (-sorted_direction) : 1;
            sortByColumnIndex(column_index, new_sorted_direction);
        };

        var sortByColumnIndex = function(column_index, direction)
        {
            var rows = element.find('.scrolltable_body tbody tr');

            // First operation determines order rows go in:
            // We actually do this in reverse of desired order and then put them
            // all in place backwards
            var cell_text_a;
            var cell_text_b;
            var sorted_rows = rows.sort(function(a, b)
            {
                cell_text_a = $(a).children()[column_index].textContent;
                cell_text_b = $(b).children()[column_index].textContent;
                return -direction * compare(cell_text_a, cell_text_b);
            });

            // Second puts them in the proper order:
            // With them all sorted 'backwards', we go through all the items besides
            // the first, and stick them in front of each other.  By the end, we have
            // our list sorted.
            var index;
            var inserting_node;
            var fixed_node;
            sorted_rows.slice(1).each(function()
            {
                index = sorted_rows.index(this);
                var inserting_node = this;
                var fixed_node = sorted_rows[index - 1];
                this.parentNode.insertBefore(inserting_node, fixed_node);
            });

            sorted_column = column_index;
            sorted_direction = direction;
            stripe();
        };

        var stripe = function()
        {
            body.find('tr').removeClass('stripe');
            body.find('tr:odd').addClass('stripe');
        };

        var toggleActivation = function(row)
        {
            if (row.hasClass('ui-selected')) { row.removeClass('ui-selected'); }
            else { row.addClass('ui-selected'); }
        };

        var setActivation = function(row_list, a, b, turnOn)
        {
            var subset;
            if (a == b) { subset = $(row_list[a]); }
            else if (a < b) { subset = row_list.slice(a, b + 1); }
            else if (a > b) { subset = row_list.slice(b, a + 1); }

            if (turnOn) { subset.addClass('ui-selected'); }
            else { subset.removeClass('ui-selected'); }
        };

        var singleselect = function(event)
        {
            if (!(event.shiftKey || event.metaKey))
            {
                var row = $(this);
                var table = row.closest("table");
                var row_list = row.closest("tbody").find("tr");
                var index_clicked = row_list.index(row);
                last_clicked_index = index_clicked;
                shift_boundary_index = index_clicked;
                row_list.removeClass('ui-selected');
                row.addClass('ui-selected');

                updateSelectedRows();
                _onSelect(selected_rows);
            }
        };

        var multiselect = function(event)
        {
            var row = $(this);
            var table = row.closest("table");
            var row_list = row.closest("tbody").find("tr");
            var index_clicked = row_list.index(row);
            if (event.shiftKey)
            {
                var last = last_clicked_index;
                var bound = shift_boundary_index;

                if (last != index_clicked)
                {
                    setActivation(row_list, last, bound, false);
                    setActivation(row_list, last, index_clicked, true);
                    shift_boundary_index = index_clicked;
                }

                updateSelectedRows();
                _onSelect(selected_rows);
            }
            else if (event.metaKey || event.ctrlKey)
            {
                toggleActivation(row);
                if (row.hasClass('ui-selected'))
                {
                    last_clicked_index = index_clicked;
                    shift_boundary_index = index_clicked;
                }

                updateSelectedRows();
                _onSelect(selected_rows);
            }
        };

        var init = function()
        {
            var scrolltable_body = document.createElement('div');
            var scrolltable_header = document.createElement('div');
            var scrolltable_wrapper = document.createElement('div');
            scrolltable_body.className = 'scrolltable_body';
            scrolltable_header.className = 'scrolltable_header';
            scrolltable_wrapper.className = 'scrolltable_wrapper';

            var scrolltable_title;
            var table_title = original_table.attr('name');
            if (table_title)
            {
                scrolltable_title = document.createElement('div');
                scrolltable_title.className = 'scrolltable_title';
                scrolltable_title.textContent = table_title;
                scrolltable_wrapper.appendChild(scrolltable_title);
            }

            scrolltable_wrapper.appendChild(scrolltable_header);
            scrolltable_wrapper.appendChild(scrolltable_body);

            var table_clone_body = original_table.clone();
            var table_clone_header = table_clone_body.clone();

            scrolltable_wrapper.setAttribute('id', table_clone_body.attr('id'));

            table_clone_body.removeAttr('id');
            table_clone_header.removeAttr('id');

            // We do a few steps to clean up the header on the table we're putting
            // into the body. We intend to keep it, because as long as we have a
            // header we can use it to fix the column widths in the body of the
            // table.
            table_clone_body.find('thead th').each(function()
            {
                var el = $(this);
                // Clean out the content - we just need the cells
                el.children().remove();
                el.text('');
                // Set the class to hide header, and remove id to prevent
                // duplicates in the DOM
                el.addClass('scrolltable_flat');
                el.removeAttr('id');
            });

            // Fewer steps needed on the one for the header - the body is useless
            // so we just dump it
            table_clone_header.find('tbody').remove();

            scrolltable_body.appendChild(table_clone_body[0]);
            scrolltable_header.appendChild(table_clone_header[0]);

            original_table[0].parentNode.replaceChild(scrolltable_wrapper, original_table[0]);

            element = $(scrolltable_wrapper);
            header = element.find('.scrolltable_header thead');
            body = element.find(".scrolltable_body tbody");
            $(scrolltable_header).find('th').click(function()
            {
                sortByElement($(this));
            });
        };

        return {
            init: init,
            resort: resort,
            sortByElement: sortByElement,
            refresh: refresh,
            select: select,
            onRefresh: onRefresh,
            onSelect: onSelect,
            getRows: getRows,
            getElement: getElement,
            getHeader: getHeader,
            getBody: getBody,
            populateTable: populateTable,
            setClickEvents: setClickEvents,
            getSelectedRows: getSelectedRows,
            updateSelectedRows: updateSelectedRows,
        };
    };
});
