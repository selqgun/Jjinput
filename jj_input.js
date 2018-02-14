/*
 * Jjinput
 * Version 1.0.1
 *
 */



(function ($) {
    // Default settings
    var DEFAULT_SETTINGS = {
        // Search settings
        method: "GET",
        queryParam: "q",
        searchDelay: 200,
        minChars: 1,
        propertyToSearch: "name",   //查询参数名和组装Json里面的显示属性名
        tokenValue: "id",       //主键名称
        jsonContainer: null,
        contentType: "json",

        // Prepopulation settings
        prePopulate: null,
        processPrePopulate: false,

        preventDuplicates: true,   //禁止重复选项

        // Display settings
        hintText: "请输入查询字符",
        tipsText: "请点击输入",
        noResultsText: "还没有匹配的结果,请重新输入.",
        alertDuplicatesText: "您选择了重复的选项.",
        searchingText: "数据读取中...",
        deleteText: "&times;",
        animateDropdown: true,
        theme: "facebook",
        zindex: 9999,
        resultsLimit: null,

        enableHTML: false,

        //Ljj修改 选择后该选项是否变成灰
        setReadOnlyWhenSelected: true,
        //Ljj修改 点击时是否显示所有可选项
        showAllItemWhenFocus: true,
        //Ljj修改 最大列表显示长度
        maxHeight:null,
        //Ljj修改 控件指定宽度
        maxWidth:null,
        //Ljj修改 增加ajax读取参数
        ajaxParameterMap: null,
        //是否使用ajax查询缓存
        ajaxCache:true,

        reallyOutFlag:true,

        resultsFormatter: function(item) {
            var string = item[this.propertyToSearch];
            return "<li>" + (this.enableHTML ? string : _escapeHTML(string)) + "</li>";
        },

        tokenFormatter: function(item) {
            var string = item[this.propertyToSearch];
            return "<li><p>" + (this.enableHTML ? string : _escapeHTML(string)) + "</p></li>";
        },

        // Tokenization settings
        tokenLimit: null,      //允许选择项个数
        tokenDelimiter: ",",



        // Behavioral settings
        allowFreeTagging: true,    //是否支持插入用户输入的自主数据项
        allowTabOut: false,

        // Callbacks
        onResult: null,     //ajax结果处理方法
        onCachedResult: null,
        onAdd: null,
        onFreeTaggingAdd: null,
        onDelete: null,
        onReady: null,

        // Other settings
        idPrefix: "token-input-",

        // Keep track if the input is currently in disabled mode
        disabled: false
    };

    // Default classes to use when theming
    var DEFAULT_CLASSES = {
        tokenList: "token-input-list",
        token: "token-input-token",
        tokenReadOnly: "token-input-token-readonly",
        tokenDelete: "token-input-delete-token",
        selectedToken: "token-input-selected-token",
        highlightedToken: "token-input-highlighted-token",
        dropdown: "token-input-dropdown",
        dropdownItem: "token-input-dropdown-item",
        dropdownItem2: "token-input-dropdown-item2",
        dropdownItemReadonly: "token-input-dropdown-item-readonly",
        dropdownItem2Readonly: "token-input-dropdown-item2-readonly",
        selectedDropdownItem: "token-input-selected-dropdown-item",
        inputToken: "token-input-input-token",
        focused: "token-input-focused",
        disabled: "token-input-disabled"
    };

    // Input box position "enum"
    var POSITION = {
        BEFORE: 0,
        AFTER: 1,
        END: 2
    };

    // Keys "enum"
    var KEY = {
        BACKSPACE: 8,
        TAB: 9,
        ENTER: 13,
        ESCAPE: 27,
        SPACE: 32,
        PAGE_UP: 33,
        PAGE_DOWN: 34,
        END: 35,
        HOME: 36,
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40,
        NUMPAD_ENTER: 108,
        COMMA: 188
    };

    var HTML_ESCAPES = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;'
    };

    var HTML_ESCAPE_CHARS = /[&<>"'\/]/g;

    function coerceToString(val) {
        return String((val === null || val === undefined) ? '' : val);
    }

    function _escapeHTML(text) {
        return coerceToString(text).replace(HTML_ESCAPE_CHARS, function(match) {
            return HTML_ESCAPES[match];
        });
    }

    // Additional public (exposed) methods
    var methods = {
        init: function(url_or_data_or_function, options) {
            var settings = $.extend({}, DEFAULT_SETTINGS, options || {});

            return this.each(function () {
                $(this).data("settings", settings);
                $(this).data("tokenInputObject", new $.TokenList(this, url_or_data_or_function, settings));
            });
        },
        updateData: function(url_or_data_or_function) {

            this.data("tokenInputObject").clear();
            $(this).data("settings").local_data = url_or_data_or_function;
            this.data("tokenInputObject").updateData(url_or_data_or_function);
            return this;
        },
        clear: function() {
            this.data("tokenInputObject").clear();
            return this;
        },
        add: function(item) {
            this.data("tokenInputObject").add(item);
            return this;
        },
        remove: function(item) {
            this.data("tokenInputObject").remove(item);
            return this;
        },
        get: function() {
            return this.data("tokenInputObject").getTokens();
        },
        toggleDisabled: function(disable) {
            this.data("tokenInputObject").toggleDisabled(disable);
            return this;
        },
        setOptions: function(options){
            $(this).data("settings", $.extend({}, $(this).data("settings"), options || {}));
            return this;
        }
    }

    // Expose the .tokenInput function to jQuery as a plugin
    $.fn.tokenInput = function (method) {
        // Method calling and initialization logic
        if(methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else {
            return methods.init.apply(this, arguments);
        }
    };

    // TokenList class for each input
    $.TokenList = function (input, url_or_data, settings) {
        //
        // Initialization
        //

        // Configure the data source
        if($.type(url_or_data) === "string" || $.type(url_or_data) === "function") {
            // Set the url to query against
            $(input).data("settings").url = url_or_data;

            // If the URL is a function, evaluate it here to do our initalization work
            var url = computeURL();

            // Make a smart guess about cross-domain if it wasn't explicitly specified
            if($(input).data("settings").crossDomain === undefined && typeof url === "string") {
                if(url.indexOf("://") === -1) {
                    $(input).data("settings").crossDomain = false;
                } else {
                    $(input).data("settings").crossDomain = (location.href.split(/\/+/g)[1] !== url.split(/\/+/g)[1]);
                }
            }
        } else if(typeof(url_or_data) === "object") {
            // Set the local data to search through
            $(input).data("settings").local_data = url_or_data;
        }

        // Build class names
        if($(input).data("settings").classes) {
            // Use custom class names
            $(input).data("settings").classes = $.extend({}, DEFAULT_CLASSES, $(input).data("settings").classes);
        } else if($(input).data("settings").theme) {
            // Use theme-suffixed default class names
            $(input).data("settings").classes = {};
            $.each(DEFAULT_CLASSES, function(key, value) {
                $(input).data("settings").classes[key] = value + "-" + $(input).data("settings").theme;
            });
        } else {
            $(input).data("settings").classes = DEFAULT_CLASSES;
        }


        // 已选项的数组 Save the tokens
        var saved_tokens = [];

        // Keep track of the number of tokens in the list
        var token_count = 0;

        // Basic cache to save on db hits
        var cache = new $.TokenList.Cache();

        // Keep track of the timeout, old vals
        var timeout;
        var input_val;

        var showTips = $(input).data("settings").tokenLimit?$(input).data("settings").tipsText+" 最多选择"+$(input).data("settings").tokenLimit+"个选项":$(input).data("settings").tipsText;

        // Create a new text input an attach keyup events
        var input_box = $("<input type=\"text\"  autocomplete=\"off\">")
            .css({
                outline: "none",
                float: "left",
                color: "#999999"
            })
            .width($(input).data("settings").maxWidth)
            .attr("id", $(input).data("settings").idPrefix + input.id)
            .val(showTips)
            .focus(function () {
                if($(this).val()==showTips){
                    $(this).val("");
                    $(this).css("color","black");
                }
                if ($(input).data("settings").disabled) {
                    return false;
                } else
                if ($(input).data("settings").tokenLimit === null || $(input).data("settings").tokenLimit !== token_count) {
                    //ljj修改 如果设置为点击显示所有列表就不显示查询字符串
                    if(!$(input).data("settings").showAllItemWhenFocus){
                        show_dropdown_hint();
                    }
                }
                token_list.addClass($(input).data("settings").classes.focused);

                //ljj修改 如果设置为点击显示所有列表就显示列表
                if ($(input).data("settings").showAllItemWhenFocus) {
                    do_search();
                }
                // if ($(input).data("settings").tokenLimit !== null && $(input).data("settings").tokenLimit === token_count) {
                //     $(input).data("settings").reallyOutFlag = true;
                // }
            })
            .blur(function () {

                hide_dropdown();

                if ($(input).data("settings").allowFreeTagging) {
                    add_freetagging_tokens();
                }
                    $(this).val("");

                token_list.removeClass($(input).data("settings").classes.focused);
            })
            .bind("keyup keydown blur update", resize_input)
            .keydown(function (event) {
                var previous_token;
                var next_token;

                switch(event.keyCode) {
                    case KEY.LEFT:
                    case KEY.RIGHT:
                    case KEY.UP:
                    case KEY.DOWN:

                        //Ljj修改 设置点击显示所有列表的话,如果输入字符为空也执行上下选择
                        if(!$(input).data("settings").showAllItemWhenFocus){
                            if(!$(this).val()) {
                                previous_token = input_token.prev();
                                next_token = input_token.next();

                                if((previous_token.length && previous_token.get(0) === selected_token) || (next_token.length && next_token.get(0) === selected_token)) {
                                    // Check if there is a previous/next token and it is selected
                                    if(event.keyCode === KEY.LEFT || event.keyCode === KEY.UP) {
                                        deselect_token($(selected_token), POSITION.BEFORE);
                                    } else {
                                        deselect_token($(selected_token), POSITION.AFTER);
                                    }
                                } else if((event.keyCode === KEY.LEFT || event.keyCode === KEY.UP) && previous_token.length) {
                                    // We are moving left, select the previous token if it exists
                                    select_token($(previous_token.get(0)));
                                } else if((event.keyCode === KEY.RIGHT || event.keyCode === KEY.DOWN) && next_token.length) {
                                    // We are moving right, select the next token if it exists
                                    select_token($(next_token.get(0)));
                                }
                            } else {
                                var dropdown_item = null;

                                if(event.keyCode === KEY.DOWN || event.keyCode === KEY.RIGHT) {
                                    dropdown_item = $(selected_dropdown_item).next();
                                } else {
                                    dropdown_item = $(selected_dropdown_item).prev();
                                }

                                if(dropdown_item.length) {
                                    select_dropdown_item(dropdown_item);
                                }
                            }

                        }else{

                            if(!dropdown.is(":hidden")){
                                var dropdown_item = null;

                                if(event.keyCode === KEY.DOWN || event.keyCode === KEY.RIGHT) {
                                    dropdown_item = $(selected_dropdown_item).next();
                                } else {
                                    dropdown_item = $(selected_dropdown_item).prev();
                                }

                                if(dropdown_item.length) {
                                    select_dropdown_item(dropdown_item);
                                }
                            }else{
                                do_search();
                            }


                        }
                        break;

                    case KEY.BACKSPACE:
                        previous_token = input_token.prev();

                        if(!$(this).val().length) {
                            if(selected_token) {
                                delete_token($(selected_token));
                                hidden_input.change();
                            } else if(previous_token.length) {
                                select_token($(previous_token.get(0)));
                            }

                            return false;
                        } else if($(this).val().length === 1) {
                            hide_dropdown();
                        } else {
                            // set a timeout just long enough to let this function finish.
                            setTimeout(function(){do_search();}, 5);
                        }
                        break;

                    case KEY.TAB:
                    case KEY.ENTER:
                    case KEY.NUMPAD_ENTER:
                    case KEY.COMMA:
                        if(selected_dropdown_item) {
                            add_token($(selected_dropdown_item).data("tokeninput"));
                            hidden_input.change();
                        } else {

                            if ($(input).data("settings").allowFreeTagging) {
                                if($(input).data("settings").allowTabOut && $(this).val() === "") {
                                    return true;
                                } else {
                                    add_freetagging_tokens();
                                }
                            } else {
                                $(this).val("");
                                if($(input).data("settings").allowTabOut) {
                                    return true;
                                }
                            }
                            event.stopPropagation();
                            event.preventDefault();
                        }
                        return false;

                    case KEY.ESCAPE:
                        hide_dropdown();
                        return true;

                    default:
                        if(String.fromCharCode(event.which)) {
                            // set a timeout just long enough to let this function finish.
                            setTimeout(function(){do_search();}, 5);
                        }
                        break;
                }
            });

        // Keep a reference to the original input box
        var hidden_input = $(input)
            .hide()
            .val("")
            .focus(function () {
                focus_with_timeout(input_box);
            })
            .blur(function () {
                input_box.blur();
            });

        // Keep a reference to the selected token and dropdown item
        var selected_token = null;
        var selected_token_index = 0;
        var selected_dropdown_item = null;
        // The list to store the token items in
        var token_list = $("<ul />")
            .addClass($(input).data("settings").classes.tokenList)
            .attr('name',input.id+'_ul')
            .click(function (event) {

                var li = $(event.target).closest("li");
                if(li && li.get(0) && $.data(li.get(0), "tokeninput")) {
                    toggle_select_token(li);
                } else {
                    // Deselect selected token
                    if(selected_token) {
                        deselect_token($(selected_token), POSITION.END);
                    }

                    // Focus input box
                    if($(input).data("settings").tokenLimit === null || token_count < $(input).data("settings").tokenLimit) {
                        focus_with_timeout(input_box);
                    }

                }
            })
            .mouseover(function (event) {
                var li = $(event.target).closest("li");
                if(li && selected_token !== this) {
                    li.addClass($(input).data("settings").classes.highlightedToken);
                }
                $(input).data("settings").reallyOutFlag = false;
            })
            .mouseout(function (event) {
                var li = $(event.target).closest("li");
                if(li && selected_token !== this) {
                    li.removeClass($(input).data("settings").classes.highlightedToken);
                }
                $(input).data("settings").reallyOutFlag = true;
            })
            .insertBefore(hidden_input);

        //ljj修改设置输入框长度
        //alert(hidden_input.width());
        token_list.width($(input).data("settings").maxWidth);

        // The token holding the input box
        var input_token = $("<li />")
            .addClass($(input).data("settings").classes.inputToken)
            .appendTo(token_list)
            .append(input_box);

        // The list to store the dropdown items in
        var dropdown = $("<div>")
            .addClass($(input).data("settings").classes.dropdown)
            .appendTo("body")
            .hide();

        // Magic element to help us resize the text input
        var input_resizer = $("<tester/>")
            .insertAfter(input_box)
            .css({
                position: "absolute",
                top: -9999,
                left: -9999,
                width: "auto",
                fontSize: input_box.css("fontSize"),
                fontFamily: input_box.css("fontFamily"),
                fontWeight: input_box.css("fontWeight"),
                letterSpacing: input_box.css("letterSpacing"),
                whiteSpace: "nowrap"
            });

        // Pre-populate list if items exist
        hidden_input.val("");
        var li_data = $(input).data("settings").prePopulate || hidden_input.data("pre");
        if($(input).data("settings").processPrePopulate && $.isFunction($(input).data("settings").onResult)) {
            li_data = $(input).data("settings").onResult.call(hidden_input, li_data);
        }
        if(li_data && li_data.length) {
            $.each(li_data, function (index, value) {
                insert_token(value);
                checkTokenLimit();
            });
        }

        // Check if widget should initialize as disabled
        if ($(input).data("settings").disabled) {
            toggleDisabled(true);
        }

        // Initialization is done
        if($.isFunction($(input).data("settings").onReady)) {
            $(input).data("settings").onReady.call();
        }

        //
        // Public functions
        //

        this.clear = function() {

            token_list.children("li").each(function() {
                if ($(this).children("input").length === 0) {
                    delete_token($(this));
                }
            });
        }

        this.add = function(item) {
            add_token(item);
        }

        this.updateData = function(result) {

            //Ljj修改 更新候选数据时清空缓存
            cache = new $.TokenList.Cache();
            populate_dropdown("", result);
        }

        this.remove = function(item) {
            token_list.children("li").each(function() {
                if ($(this).children("input").length === 0) {
                    var currToken = $(this).data("tokeninput");
                    var match = true;
                    for (var prop in item) {
                        if (item[prop] !== currToken[prop]) {
                            match = false;
                            break;
                        }
                    }
                    if (match) {
                        delete_token($(this));
                    }
                }
            });
        }

        this.getTokens = function() {
            return saved_tokens;
        }

        this.toggleDisabled = function(disable) {
            toggleDisabled(disable);
        }

        //
        // Private functions
        //

        function escapeHTML(text) {
            return $(input).data("settings").enableHTML ? text : _escapeHTML(text);
        }

        // Toggles the widget between enabled and disabled state, or according
        // to the [disable] parameter.
        function toggleDisabled(disable) {
            if (typeof disable === 'boolean') {
                $(input).data("settings").disabled = disable
            } else {
                $(input).data("settings").disabled = !$(input).data("settings").disabled;
            }
            input_box.attr('disabled', $(input).data("settings").disabled);
            token_list.toggleClass($(input).data("settings").classes.disabled, $(input).data("settings").disabled);
            // if there is any token selected we deselect it
            if(selected_token) {
                deselect_token($(selected_token), POSITION.END);
            }
            hidden_input.attr('disabled', $(input).data("settings").disabled);
        }

        function checkTokenLimit() {
            if($(input).data("settings").tokenLimit !== null && token_count >= $(input).data("settings").tokenLimit) {
                input_box.hide();
                hide_dropdown();
                return;
            }
        }

        function resize_input() {
            if(input_val === (input_val = input_box.val())) {return;}

            // Enter new content into resizer and resize input accordingly
            input_resizer.html(_escapeHTML(input_val));
            input_box.width(input_resizer.width() + 30);
        }

        function is_printable_character(keycode) {
            return ((keycode >= 48 && keycode <= 90) ||     // 0-1a-z
            (keycode >= 96 && keycode <= 111) ||    // numpad 0-9 + - / * .
            (keycode >= 186 && keycode <= 192) ||   // ; = , - . / ^
            (keycode >= 219 && keycode <= 222));    // ( \ ) '
        }

        function add_freetagging_tokens() {
            var value = $.trim(input_box.val());
            var tokens = value.split($(input).data("settings").tokenDelimiter);
            $.each(tokens, function(i, token) {
                if (!token) {
                    return;
                }

                if ($.isFunction($(input).data("settings").onFreeTaggingAdd)) {
                    token = $(input).data("settings").onFreeTaggingAdd.call(hidden_input, token);
                }
                var object = {};
                object[$(input).data("settings").tokenValue] = object[$(input).data("settings").propertyToSearch] = token;
                add_token(object);
            });
        }

        // Inner function to a token to the list
        function insert_token(item) {
            var $this_token = $($(input).data("settings").tokenFormatter(item));
            var readonly = item.readonly === true ? true : false;

            if(readonly) $this_token.addClass($(input).data("settings").classes.tokenReadOnly);


            //Ljj修改 如果是只读的选项就不插入到已选项中
            // The 'delete token' button
            if(!readonly) {
                $this_token.addClass($(input).data("settings").classes.token).insertBefore(input_token);

                $("<span>" + $(input).data("settings").deleteText + "</span>")
                    .addClass($(input).data("settings").classes.tokenDelete)
                    .appendTo($this_token)
                    .click(function () {
                        if (!$(input).data("settings").disabled) {
                            delete_token($(this).parent());
                            hidden_input.change();
                            return false;
                        }
                    });


                // Store data on the token
                var token_data = item;
                $.data($this_token.get(0), "tokeninput", item);

                // 添加到已选项数组中 Save this token for duplicate checking
                saved_tokens = saved_tokens.slice(0,selected_token_index).concat([token_data]).concat(saved_tokens.slice(selected_token_index));
                selected_token_index++;

                // Update the hidden input
                update_hidden_input(saved_tokens, hidden_input);

                token_count += 1;

                // Check the token limit
                checkTokenLimit();

            }



            return $this_token;
        }

        // Add a token to the token list based on user input
        function add_token (item) {
            var callback = $(input).data("settings").onAdd;

            // See if the token already exists and select it if we don't want duplicates
            if(token_count > 0 && $(input).data("settings").preventDuplicates) {
                var found_existing_token = null;
                token_list.children().each(function () {
                    var existing_token = $(this);
                    var existing_data = $.data(existing_token.get(0), "tokeninput");
                    if(existing_data && existing_data[$(input).data("settings").tokenValue] == item[$(input).data("settings").tokenValue]) {
                        found_existing_token = existing_token;
                        return false;
                    }
                });

                if(found_existing_token) {
                    select_token(found_existing_token);
                    deselect_token(found_existing_token, POSITION.END);
                    focus_with_timeout(input_box);
                    //LJJ修改 提示选择重复的记录
                    alert($(input).data("settings").alertDuplicatesText);
                    hide_dropdown(true);
                    return;
                }
            }

            // Insert the new tokens
            if($(input).data("settings").tokenLimit == null || token_count < $(input).data("settings").tokenLimit) {
                insert_token(item);
                checkTokenLimit();
            }else{//LJJ修改 提示最多只能选择的个数
                alert("您最多只能选择"+$(input).data("settings").tokenLimit+"个选项,请删除后再选择.");
            }

            // Clear input box
            input_box.val("");

            // Don't show the help dropdown, they've got the idea
            hide_dropdown(true);

            // Execute the onAdd callback if defined
            if($.isFunction(callback)) {
                callback.call(hidden_input,item);
            }
        }

        // Select a token in the token list
        function select_token (token) {
            if (!$(input).data("settings").disabled) {
                token.addClass($(input).data("settings").classes.selectedToken);
                selected_token = token.get(0);

                // Hide input box
                input_box.val("");

                // Hide dropdown if it is visible (eg if we clicked to select token)
                hide_dropdown();
            }
        }

        // Deselect a token in the token list
        function deselect_token (token, position) {
            token.removeClass($(input).data("settings").classes.selectedToken);
            selected_token = null;

            if(position === POSITION.BEFORE) {
                input_token.insertBefore(token);
                selected_token_index--;
            } else if(position === POSITION.AFTER) {
                input_token.insertAfter(token);
                selected_token_index++;
            } else {
                input_token.appendTo(token_list);
                selected_token_index = token_count;
            }

            // Show the input box and give it focus again
            if($(input).data("settings").tokenLimit === null || token_count < $(input).data("settings").tokenLimit) {
                focus_with_timeout(input_box);
            }
        }

        // Toggle selection of a token in the token list
        function toggle_select_token(token) {

            var previous_selected_token = selected_token;

            if(selected_token) {
                deselect_token($(selected_token), POSITION.END);
            }

            if(previous_selected_token === token.get(0)) {
                deselect_token(token, POSITION.END);
            } else {
                select_token(token);
            }
        }

        // Delete a token from the token list
        function delete_token (token) {
            // Remove the id from the saved list
            var token_data = $.data(token.get(0), "tokeninput");
            var callback = $(input).data("settings").onDelete;

            var index = token.prevAll().length;
            if(index > selected_token_index) index--;

            // Delete the token
            token.remove();
            selected_token = null;

            // Show the input box and give it focus again
            focus_with_timeout(input_box);

            // Remove this token from the saved list
            saved_tokens = saved_tokens.slice(0,index).concat(saved_tokens.slice(index+1));
            if(index < selected_token_index) selected_token_index--;

            // Update the hidden input
            update_hidden_input(saved_tokens, hidden_input);

            token_count -= 1;

            if($(input).data("settings").tokenLimit !== null) {
                input_box
                    .show()
                    .val("");
                focus_with_timeout(input_box);
            }

            // Execute the onDelete callback if defined
            if($.isFunction(callback)) {
                callback.call(hidden_input,token_data);
            }
        }

        // Update the hidden input box value
        function update_hidden_input(saved_tokens, hidden_input) {
            var token_values = $.map(saved_tokens, function (el) {
                if(typeof $(input).data("settings").tokenValue == 'function')
                    return $(input).data("settings").tokenValue.call(this, el);

                return el[$(input).data("settings").tokenValue];
            });

            hidden_input.val(token_values.join($(input).data("settings").tokenDelimiter));
        }

        // Hide and clear the results dropdown
        function hide_dropdown (isFroce) {

            var pFlag = false;
            if(/msie/.test(navigator.userAgent.toLowerCase())){
                if(document.activeElement!=dropdown[0]){
                    pFlag = true;
                }
            }else{
                if($(input).data("settings").reallyOutFlag){
                    pFlag = true;
                }
            }
            if(isFroce || pFlag){
                dropdown.hide().empty();
                selected_dropdown_item = null;
            }
        }

        function show_dropdown() {
            dropdown
                .css({
                    position: "absolute",
                    top: $(token_list).offset().top + $(token_list).outerHeight(),
                    left: $(token_list).offset().left,
                    width: $(token_list).outerWidth(),

                    'z-index': $(input).data("settings").zindex
                })
                .mouseout(function(){
                    $(input).data("settings").reallyOutFlag = true;
                })
                .mouseover(function(){
                    $(input).data("settings").reallyOutFlag = false;
                })
                .show();


            //ljj修改 如果有最大高度限制就设置滚动条
            if($(input).data("settings").maxHeight){
                dropdown.css({
                    height:$(input).data("settings").maxHeight,
                    overflow:"auto"
                })
                //dropdown.html('<iframe style="position:absolute; z-index:-1;" frameborder="0" width="100%" height="'+ $(input).data("settings").maxHeight +'" scrolling="no" src="about:blank"></iframe>')
            }
        }

        function show_dropdown_searching () {
            if($(input).data("settings").searchingText) {
                dropdown.html("<p>" + escapeHTML($(input).data("settings").searchingText) + "</p>");
                show_dropdown();
            }
        }

        function show_dropdown_hint () {
            if($(input).data("settings").hintText) {
                dropdown.html("<p>" + escapeHTML($(input).data("settings").hintText) + "</p>");
                show_dropdown();
            }
        }

        var regexp_special_chars = new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\-]', 'g');
        function regexp_escape(term) {
            return term.replace(regexp_special_chars, '\\$&');
        }

        // Highlight the query part of the search term
        function highlight_term(value, term) {
            return value.replace(
                new RegExp(
                    "(?![^&;]+;)(?!<[^<>]*)(" + regexp_escape(term) + ")(?![^<>]*>)(?![^&;]+;)",
                    "gi"
                ), function(match, p1) {
                    return "<b>" + escapeHTML(p1) + "</b>";
                }
            );
        }

        function find_value_and_highlight_term(template, value, term) {
            return template.replace(new RegExp("(?![^&;]+;)(?!<[^<>]*)(" + regexp_escape(value) + ")(?![^<>]*>)(?![^&;]+;)", "g"), highlight_term(value, term));
        }

        // Populate the results dropdown with some results
        function populate_dropdown (query, results) {

            if(results && results.length) {
                dropdown.empty();

                //LJJ修改 用iframe遮挡在ie6下select控件穿透问题
                if(results.length*17<=$(input).data("settings").maxHeight){
                    dropdown.html('<iframe style="position:absolute; z-index:-1;" frameborder="0" width="100%" height="'+ $(input).data("settings").maxHeight +'" scrolling="no" src="about:blank"></iframe>')
                }else{
                    dropdown.html('<iframe style="position:absolute; z-index:-1;" frameborder="0" width="100%" height="'+ results.length*17 +'" scrolling="no" src="about:blank"></iframe>')
                }
                var dropdown_ul = $("<ul>")
                    .appendTo(dropdown)
                    .mouseover(function (event) {
                        select_dropdown_item($(event.target).closest("li"));
                    })
                    .mousedown(function (event) {
                        add_token($(event.target).closest("li").data("tokeninput"));
                        hidden_input.change();
                        return false;
                    })
                    .hide();

                if ($(input).data("settings").resultsLimit && results.length > $(input).data("settings").resultsLimit) {
                    results = results.slice(0, $(input).data("settings").resultsLimit);
                }

                //设置已选项的id Map
                var selectedMap = {};
                $.each(saved_tokens,function(index, selectedToken) {
                    selectedMap[selectedToken[$(input).data("settings").tokenValue]] = selectedToken[$(input).data("settings").tokenValue];
                });

                $.each(results, function(index, value) {

                    var this_li = $(input).data("settings").resultsFormatter(value);

                    this_li = find_value_and_highlight_term(this_li ,value[$(input).data("settings").propertyToSearch], query);

                    this_li = $(this_li).appendTo(dropdown_ul);

                    var readonly = value.readonly === true ? true : false;

                    //选择后该选项是否变成灰
                    var selectedFlag = false;
                    if($(input).data("settings").setReadOnlyWhenSelected){
                        if(selectedMap[value[$(input).data("settings").tokenValue]] != null){
                            selectedFlag = true;
                        }
                    }

                    //LJJ修改 如果选项是只读或已被选择,就显示灰色字的样式
                    if(readonly || selectedFlag){
                        if(index % 2) {
                            this_li.addClass($(input).data("settings").classes.dropdownItemReadonly);
                        } else {
                            this_li.addClass($(input).data("settings").classes.dropdownItem2Readonly);
                        }
                    }else{
                        if(index % 2) {
                            this_li.addClass($(input).data("settings").classes.dropdownItem);
                        } else {
                            this_li.addClass($(input).data("settings").classes.dropdownItem2);
                        }
                    }

                    //默认选中第一项
                    if(index == 0) {
                        select_dropdown_item(this_li);
                    }

                    $.data(this_li.get(0), "tokeninput", value);
                });

                //可见时才显示下拉
                if(!$(input).data("settings").reallyOutFlag && $(input_box).is(":visible")) {
                    show_dropdown();
                }

                if($(input).data("settings").animateDropdown) {
                    dropdown_ul.slideDown("fast");
                } else {
                    dropdown_ul.show();
                }
            } else {
                if($(input).data("settings").noResultsText) {
                    dropdown.html("<p>" + escapeHTML($(input).data("settings").noResultsText) + "</p>");

                    selected_dropdown_item = null;
                    //可见时才显示下拉
                    if(!$(input).data("settings").reallyOutFlag && $(input_box).is(":visible")) {
                        show_dropdown();
                    }
                }
            }
        }

        // Highlight an item in the results dropdown
        function select_dropdown_item (item) {
            if(item) {
                if(selected_dropdown_item) {
                    deselect_dropdown_item($(selected_dropdown_item));
                }

                item.addClass($(input).data("settings").classes.selectedDropdownItem);
                selected_dropdown_item = item.get(0);
            }
        }

        // Remove highlighting from an item in the results dropdown
        function deselect_dropdown_item (item) {
            item.removeClass($(input).data("settings").classes.selectedDropdownItem);
            selected_dropdown_item = null;
        }

        // Do a search and show the "searching" dropdown if the input is longer
        // than $(input).data("settings").minChars
        function do_search() {
            var query = input_box.val();

            if(query && query.length) {
                if(selected_token) {
                    deselect_token($(selected_token), POSITION.AFTER);
                }


                if(query.length >= $(input).data("settings").minChars && query!="请点击输入...") {
                    show_dropdown_searching();
                    clearTimeout(timeout);

                    timeout = setTimeout(function(){
                        run_search(query);
                    }, $(input).data("settings").searchDelay);
                } else {
                    hide_dropdown();
                }
            }else{//Ljj修改如果输入字符为空也显示列表
                if($(input).data("settings").showAllItemWhenFocus){
                    run_search("");
                }
            }
        }

        // Do the actual search
        function run_search(query) {

            var cache_key = query + computeURL();
            var cached_results = cache.get(cache_key);
            if(cached_results) {
                if ($.isFunction($(input).data("settings").onCachedResult)) {
                    cached_results = $(input).data("settings").onCachedResult.call(hidden_input, cached_results);
                }
                populate_dropdown(query, cached_results);
            } else {
                // Are we doing an ajax search or local data search?
                if($(input).data("settings").url) {
                    var url = computeURL();
                    // Extract exisiting get params
                    var ajax_params = {};
                    ajax_params.data = {};
                    if(url.indexOf("?") > -1) {
                        var parts = url.split("?");
                        ajax_params.url = parts[0];

                        var param_array = parts[1].split("&");
                        $.each(param_array, function (index, value) {
                            var kv = value.split("=");
                            ajax_params.data[kv[0]] = kv[1];
                        });
                    } else {
                        ajax_params.url = url;
                    }


                    //Ljj修改 增加ajax查询参数
                    var ajaxParameterMap = $(input).data("settings").ajaxParameterMap;
                    if(ajaxParameterMap!=null){
                        for(var key in ajaxParameterMap) {
                            ajax_params.data[key] = $.trim($("[name="+ ajaxParameterMap[key] +"]").val());
                        }
                    }

                    // if(ajaxParameterMap!=null && !ajaxParameterMap.isEmpty()){
                    //     var keySet = ajaxParameterMap.keys();
                    //     for(var qq=0;qq<keySet.length;qq++){
                    //         ajax_params.data[keySet[qq]] = $.trim($("[name="+ajaxParameterMap.get(keySet[qq]) +"]").val());
                    //     }
                    // }


                    // Prepare the request
                    ajax_params.data[$(input).data("settings").queryParam] = query;
                    ajax_params.type = $(input).data("settings").method;
                    ajax_params.dataType = $(input).data("settings").contentType;
                    if($(input).data("settings").crossDomain) {
                        ajax_params.dataType = "jsonp";
                    }

                    // Attach the success callback
                    ajax_params.success = function(results) {
                        //Ljj修改是否使用ajax缓存
                        if($(input).data("settings").ajaxCache){
                            cache.add(cache_key, $(input).data("settings").jsonContainer ? results[$(input).data("settings").jsonContainer] : results);
                        }
                        if($.isFunction($(input).data("settings").onResult)) {
                            results = $(input).data("settings").onResult.call(hidden_input, results);
                        }

                        // only populate the dropdown if the results are associated with the active search query
                        if(input_box.val() === query) {
                            populate_dropdown(query, $(input).data("settings").jsonContainer ? results[$(input).data("settings").jsonContainer] : results);
                        }
                    };

                    // Make the request
                    $.ajax(ajax_params);
                } else if($(input).data("settings").local_data) {
                    // Do the search through local data


                    var results = $.grep($(input).data("settings").local_data, function (row) {
                        return row[$(input).data("settings").propertyToSearch].toLowerCase().indexOf(query.toLowerCase()) > -1;
                    });

                    cache.add(cache_key, results);
                    if($.isFunction($(input).data("settings").onResult)) {
                        results = $(input).data("settings").onResult.call(hidden_input, results);
                    }
                    populate_dropdown(query, results);



                }
            }
        }

        // compute the dynamic URL
        function computeURL() {
            var url = $(input).data("settings").url;
            if(typeof $(input).data("settings").url == 'function') {
                url = $(input).data("settings").url.call($(input).data("settings"));
            }
            return url;
        }

        // Bring browser focus to the specified object.
        // Use of setTimeout is to get around an IE bug.
        // (See, e.g., http://stackoverflow.com/questions/2600186/focus-doesnt-work-in-ie)
        //
        // obj: a jQuery object to focus()
        function focus_with_timeout(obj) {
            setTimeout(function() {
                obj.focus();
            }, 50);
        }

    };

    // Really basic cache for the results
    $.TokenList.Cache = function (options) {
        var settings = $.extend({
            max_size: 500
        }, options);

        var data = {};
        var size = 0;

        var flush = function () {
            data = {};
            size = 0;
        };

        this.add = function (query, results) {
            if(size > settings.max_size) {
                flush();
            }

            if(!data[query]) {
                size += 1;
            }

            data[query] = results;
        };

        this.get = function (query) {
            return data[query];
        };
    };
}(jQuery));
