$.ajaxSetup({
    cache: false
});

$.getJSON({
    cache: false
});

$(document).ready(function () {
    var pwd = prompt("Podaj hasło", ""); //proste zabezpieczenie haslem

    if (pwd == null) {
        SaveToLog('No password', function () {
            window.open("about:blank", "_self");
        });

    }
    else {
        if (CryptoJS.MD5(pwd) == '81dc9bdb52d04dc20036dbd8313ed055') {
            InitializePage(function () {
                $('#calendarBtn').trigger("click");
                SaveToLog('Login successful', function () { });
            });
        }
        else {            
            SaveToLog('Wrong password', function () {
                alert('Podano złe hasło.');
                window.location = 'http://zeszyt1.somee.com';
            });
            
        }
    }
});

function InitializePage(callback) {
    // linki do podstron
    $('#calendarBtn').on('click', function () {
        $("#pageContent").load("./sub/calendar.html", null, function () {
            FillSelect();
            LoadCalendar((new Date).getFullYear());
        });
    });
    $('#statsBtn').on('click', function () {
        $("#pageContent").load("./sub/stats.html", null, function () {
            LoadStats();
        });
    });
    $('#eventsBtn').on('click', function () {
        $("#pageContent").load("./sub/events.html", null, function () {
            LoadEvents();
        });
    });
    $('#cycleBtn').on('click', function () {
        $("#pageContent").load("./sub/cycle.html", null, function () {
            LoadCycle();
        });
    });


    //załadowanie modala
    LoadModal();
    LoadRemoval();

    callback();

    //inicjalizacja
    $.ajax({
        url: "/app?action=init",
        type: "POST",
        data: {},
        success: function (data) {
            var start_pos = data.indexOf('{') + 1;
            var end_pos = data.indexOf('}', start_pos);
            var extractDataString = data.substring(start_pos, end_pos)
            data = JSON.parse("{" + extractDataString + "}"); // string->JSON object
            //alert(data.Value);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            alert("Error! Status: " + textStatus + ", " + errorThrown);
        }
    });



}

// https://www.wolframalpha.com/input/?i=%28x-A%29%5E2%2B%28y-B%29%5E2%3DR%5E2%2C+y%3Dax%2Bb

function LoadCycle() {
    // Dynamicznie zmieniane:
    // 1) Kropka na osi pokazująca który jest dzien cyklu
    // 2) Informacja ile dni pozostalo do kolejnego cyklu
    $.getJSON('./data/dates.json', function (dataString) {
        var dates = [];
        for (var i = 0; i < dataString.length; i++) {
            var dateString = dataString[i].Date.split("-");
            date = new Date(Number(dateString[0]), Number(dateString[1]) - 1, Number(dateString[2]));
            dates.push(date);
        }
        var cycleDay = dateDiffInDays(dates[dates.length - 1], new Date()) + 1;

        $.getJSON('./data/stats.json', function (dataString) {
            setTimeout(200, function () { });
            var median = dataString.Median;
            var predicitionDate = dates[dates.length - 1];
            predicitionDate.setDate(predicitionDate.getDate() + Number(median));
            var daysToNextCycle = dateDiffInDays(new Date(), predicitionDate);

            //console.log("Który dzień cyklu (cycleDay): " + cycleDay);
            //console.log("Data poczatku kolejnego cyklu (predictionDate): " + predicitionDate);
            //console.log("Liczba dni do następnego cyklu (daysToNextCycle): " + daysToNextCycle);

            // *** Rysowanie wykresu ***

            var c = document.getElementById("svg-cycle").contentDocument;
            var todayCircle = c.getElementById("path4510");
            var todayLabel = c.getElementById("text5116");
            var daysLeft = c.getElementById("tspan4537");

            c.getElementById("text4539").textContent = String(daysToNextCycle).padStart(2, '0');
            c.getElementById("text4539").setAttribute("style", "font-size: 50px;");

            c.getElementById("text5116").textContent = String(cycleDay).padStart(2, '0');
            c.getElementById("text5116").setAttribute("style", "font-size: 40px;");

            if (daysToNextCycle < 0) {
                c.getElementById("text4539").textContent = String(-daysToNextCycle).padStart(2, '0');
                c.getElementById("text4539-4").textContent = "Opóźnienie";
                c.getElementById("text4539-4").setAttribute("style", "font-size: 50px;");
                c.getElementById("text4539-1").textContent = "dni";
                c.getElementById("text4539-1").setAttribute("style", "font-size: 50px;");
            }

            cycleDay = Math.min(cycleDay, 28);

            // Parametry narysowanego SVG:
            B_cx = 250;
            B_cy = 250;
            R = 175;

            var alpha = 2 * Math.PI / 28 * (28 - cycleDay) + 2 * Math.PI / 28 / 2;
            // r-nie prostej y = a * x + b
            var a = Math.tan(Math.PI/2 - alpha);
            var b = B_cy - B_cx * Math.tan(Math.PI/2 - alpha); 
            // r-nie okręgu (dużego) (x - Sx)^2 + (y - Sy)^2 = R^2 o środku (Sx, Sy)
            var A = B_cx;
            var B = B_cy;
            // wynik przecięcia równań
            var x1 = (-Math.sqrt(-a * a * A * A + a * a * R * R - 2 * a * A * b + 2 * a * A * B - b * b + 2 * b * B - B * B + R * R) - a * b + a * B + A) / (a * a + 1);
            var y1 = (-a * Math.sqrt(-a * a * A * A + a * a * R * R - 2 * a * A * b + 2 * a * A * B - b * b + 2 * b * B - B * B + R * R) + a * a * B + a * A + b) / (a * a + 1);
            var x2 = (Math.sqrt(-a * a * A * A + a * a * R * R - 2 * a * A * b + 2 * a * A * B - b * b + 2 * b * B - B * B + R * R) - a * b + a * B + A) / (a * a + 1);
            var y2 = (a * Math.sqrt(-a * a * A * A + a * a * R * R - 2 * a * A * b + 2 * a * A * B - b * b + 2 * b * B - B * B + R * R) + a * a * B + a * A + b) / (a * a + 1);

            if (cycleDay > 14) {
                todayCircle.setAttribute("cx", x1 + "px");
                todayCircle.setAttribute("cy", y1 + "px");
                todayLabel.setAttribute("x", x1 - 21 + "px");
                todayLabel.setAttribute("y", y1 + 21 / 2 + "px");
            } else {
                todayCircle.setAttribute("cx", x2 + "px");
                todayCircle.setAttribute("cy", y2 + "px");
                todayLabel.setAttribute("x", x2 - 21 + "px");
                todayLabel.setAttribute("y", y2 + 21/2 + "px");
            }

        }); // --- koniec getJSON stats
    }); // ------- koniec getJSON dates
}

function LoadCalendar(year) {
    ClearTable();
    EnableDays(year);

    $.getJSON('./data/dates.json', function (dataString) {
        var dates = [];
        for (var i = 0; i < dataString.length; i++) {
            var dateString = dataString[i].Date.split("-");
            date = new Date(Number(dateString[0]), Number(dateString[1]) - 1, Number(dateString[2]));
            dates.push(date);
        }

        // wypełnienie okresami
        for (var i = 0; i < dates.length; i++) {
            if (dates[i].getFullYear() == year) {
                var day = dates[i].getDate();
                var month = dates[i].getMonth() + 1;
                $('[day=' + day + '-' + month + ']').addClass('periodDay');
            }
        }

        // wypełnienie predykcją
        $.getJSON('./data/stats.json', function (dataString) {
            var median = dataString.Median;
            var predicitionDate = dates[dates.length - 1];
            var predictionDateMinus1 = dates[dates.length - 1];
            var predictionDatePlus1 = dates[dates.length - 1];

            predicitionDate.setDate(predicitionDate.getDate() + Number(median));
            var PDday = predicitionDate.getDate();
            var PDmonth = predicitionDate.getMonth() + 1;
            var PDyear = predicitionDate.getFullYear();
            var PDdayOfWeek = predicitionDate.getDay();

            if (PDyear == $('#selYear').val()) {
                $('[day=' + PDday + '-' + PDmonth + ']').addClass('highPredictionDay');
            }

            $('#predicitionDay').text(PDday + '. ' + SetMonthText(PDmonth) + ' (' + daysPolish[PDdayOfWeek] + ')');

            predicitionDate.setDate(predicitionDate.getDate() + 1);
            var PDM1day = predicitionDate.getDate();
            var PDM1month = predicitionDate.getMonth() + 1;
            var PDM1year = predicitionDate.getFullYear();

            if (PDM1year == $('#selYear').val()) {
                $('[day=' + PDM1day + '-' + PDM1month + ']').addClass('lowPredictionDay');
            }

            predicitionDate.setDate(predicitionDate.getDate() - 2);
            var PDP1day = predicitionDate.getDate();
            var PDP1month = predicitionDate.getMonth() + 1;
            var PDP1year = predicitionDate.getFullYear();

            if (PDP1year == $('#selYear').val()) {
                $('[day=' + PDP1day + '-' + PDP1month + ']').addClass('lowPredictionDay');

            }
        }); // --- koniec getJSON stats
    }); // ------- koniec getJSON dates
}

function EnableDays(year) {
    $("[day='29-2']").addClass('disabledDay');
    $("[day='30-2']").addClass('disabledDay');
    $("[day='31-2']").addClass('disabledDay');
    $("[day='31-4']").addClass('disabledDay');
    $("[day='31-6']").addClass('disabledDay');
    $("[day='31-9']").addClass('disabledDay');
    $("[day='31-11']").addClass('disabledDay');
    if (year % 4 == 0) { // rok przestępny - usuń disabled z 29. lutego
        $("[day='29-2']").removeClass('disabledDay');
    }
}

function ClearTable() {
    $("#data-table td").removeClass("periodDay");
    $("#data-table td").removeClass("highPredictionDay");
    $("#data-table td").removeClass("lowPredictionDay");

}

function FillSelect() {
    // usunięcie poprzednich
    $('#selYear').find('option')
    .remove()
    .end()
    ;

    // lata poprzednie
    for (var year = 2013; year < (new Date).getFullYear() ; year++) {
        $('#selYear')
            .append($("<option></option>")
            .attr("value", year)
            .text(year));
    }

    // rok bieżący
    $('#selYear')
                .append($("<option selected></option>")
                .attr("value", (new Date).getFullYear())
                .text((new Date).getFullYear()));

    // event on click
    $('#selYear').on('change', function (e) {
        LoadCalendar(this.value);
    });
}

function SetMonthText(month) {
    switch (month) {
        case 1:
            return "stycznia"
            break;
        case 2:
            return "lutego"
            break;
        case 3:
            return "marca"
            break;
        case 4:
            return "kwietnia"
            break;
        case 5:
            return "maja"
            break;
        case 6:
            return "czerwca"
            break;
        case 7:
            return "lipca"
            break;
        case 8:
            return "sierpnia"
            break;
        case 9:
            return "września"
            break;
        case 10:
            return "października"
            break;
        case 11:
            return "listopada"
            break;
        case 12:
            return "grudnia"
            break;

    }
}

function LoadStats() {
    $.getJSON('./data/stats.json', function (dataString) {
        var average = dataString.Average;
        var median = dataString.Median;
        var dominant = dataString.Dominant;
        var standardDeviation = dataString.StandardDeviation;
        var min = dataString.Min;
        var max = dataString.Max;

        $('#average').text(average);
        $('#median').text(median);
        $('#dominant').text(dominant);
        $('#standardDeviation').text(standardDeviation);
        $('#min').text(min);
        $('#max').text(max);
    });

    $.getJSON('./data/dates.json', function (dataString) {
        var lengths = [];
        var min = 100;
        var max = 0;
        for (var i = 0; i < dataString.length; i++) {
            lengths[i] = dataString[i].Length;
            if (lengths[i]<min) {
                min = lengths[i];
            }
            if (lengths[i] > max) {
                max = lengths[i];
            }
        }
        console.log(min, max);
        var s1 = [];
        var ticks = [];
        for (var i = min; i <= max; i++) {
            s1[i-min] = 0;
            ticks.push(i);
        }
        for (var i = 0; i < dataString.length; i++) {
            var colNr = dataString[i].Length - min;
            s1[colNr] = s1[colNr]+1;
        }

        var data = {};
        data.key = "Histogram";
        data.values = [];
        for (var i = min; i <= max; i++) {
            var object = {};
            object.label = ticks[i - min];
            object.value = s1[i - min];
            data.values[i-min] = object;
        }
        var dataArr = [];
        dataArr[0] = data;

        nv.addGraph(function () {
            var chart = nv.models.discreteBarChart()
                .x(function (d) { return d.label })
                .y(function (d) { return d.value })
                .staggerLabels(false)
                //.staggerLabels(historicalBarChart[0].values.length > 8)
                .showValues(false)
                .duration(250)
                .color(['#aec7e8']);
            ;
            chart.yDomain([0,30]);
            d3.select('#chart1 svg')
                .datum(dataArr)
                .call(chart);

            nv.utils.windowResize(chart.update);
            return chart;
        });
        
    });
}

function LoadModal() {
    $.getJSON('./data/dates.json', function (dataString) {
        var lastDate = dataString[dataString.length - 1].Date;
        var firstDate = new Date(lastDate);
        firstDate.setDate(firstDate.getDate() + 1);
        $('.datepicker').datepicker({
            disableEntry: true,
            format: 'dd/mm/yyyy',
            language: "pl-PL",
            weekStart: 1,
            autoclose: true,
            startDate: firstDate
        });
    }
    );


    $('#addNewModal-btn').on("click", function () {
        $('#datepicker').datepicker('update', new Date());
        
        $('#addNewModal').modal('show');
        $("#myNavbar").collapse('hide');
    })

    $('#sendEvent').on("click", function (e) {
        var sentDate = $('#datepicker').val();
        $.ajax({
            url: "/app?action=addNew",
            type: "POST",
            data: {
                Event: $('#datepicker').val()
            },
            success: function (data,params) {
                $("#pageContent").load("./sub/calendar.html", null, function () {
                    FillSelect();
                    LoadCalendar((new Date).getFullYear());
                    sentDate = sentDate.split("/");
                    sentDate = new Date(sentDate[2], sentDate[1] - 1, sentDate[0]);
                    sentDate.setDate(sentDate.getDate() + 1);
                    $('#datepicker').datepicker('setStartDate', sentDate);
                });
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert("Error! Status: " + textStatus + ", " + errorThrown);
            }
        });
    })
}

function LoadRemoval() {
    $('#deleteLastModal-btn').on("click", function () {
        $.getJSON('./data/dates.json', function (dataString) {
            var lastDate = dataString[dataString.length - 1].Date;
            $('#lastDateRemoval').text("Czy na pewno chcesz usunąć wpis z daty " + lastDate + "?");
            $('#deleteLastModal').modal('show');
        }
        );
    });

    $('#acceptRemoval').on("click", function () {
        $.ajax({
            url: "/app?action=removeLast",
            type: "POST",
            data: {},
            success: function (data) {
                $('#calendarBtn').trigger("click");

                $.getJSON('./data/dates.json', function (dataString) {
                    var lastDate = dataString[dataString.length - 1].Date;
                    console.log(lastDate);
                    lastDate = lastDate.split("-");
                    console.log(lastDate);
                    lastDate = new Date(lastDate[0], lastDate[1] - 1, lastDate[2]);
                    console.log(lastDate);
                    lastDate.setDate(lastDate.getDate() + 1)
                    $('#datepicker').datepicker('setStartDate', lastDate);
                }
                );
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert("Error! Status: " + textStatus + ", " + errorThrown);
            }
        });
    });

}

function LoadEvents() {
    $.getJSON('./data/dates.json', function (dataString) {
        $('#events-table body').remove();
        var body = new $('<tbody>');       
        for (var i = 0; i < dataString.length; i++) {
            var row = new $('<tr>');
            var cell1 = new $('<td>');
            var cell2 = new $('<td>');
            var cell3 = new $('<td>');
            cell1.text(dataString[i].Id);
            cell1.appendTo(row);
            cell2.text(dataString[i].Date);
            cell2.appendTo(row);
            cell3.text(dataString[i].Length);
            cell3.appendTo(row);
            row.appendTo(body);
        }
        body.appendTo($('#events-table'));
    }); // ------- koniec getJSON dates
}

var daysPolish = ["niedziela", "poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota"];

function SaveToLog(loginInfo, callback) {
    var entry = {};
    var currentdate = new Date();
    var datetime = currentdate.getDate() + "/"
                    + (currentdate.getMonth() + 1) + "/"
                    + currentdate.getFullYear() + " @ "
                    + currentdate.getHours() + ":"
                    + currentdate.getMinutes() + ":"
                    + currentdate.getSeconds();
    entry.datetime = datetime;
    $.get("http://ipinfo.io", function (response) {
        entry.ip = response.ip;
        entry.city = response.city;
        entry.country = response.country;
        entry.userAgent = navigator.userAgent;
        entry.loginInfo = loginInfo;
        entry.mobile = mobileCheck();
        SaveLogToFile(entry, callback);
    }, "jsonp");
}

function SaveLogToFile(entry, callback) {
    $.ajax({
        url: "/app?action=addLog",
        type: "POST",
        data: {
            City: entry.city,
            Country: entry.country,
            Datetime: entry.datetime,
            Ip: entry.ip,
            LoginInfo: entry.loginInfo,
            Mobile: entry.mobile,
            UserAgent: entry.userAgent
        },
        success: function (data, params) {
            callback();
        },
        error: function (jqXHR, textStatus, errorThrown) {
            alert("Error! Status: " + textStatus + ", " + errorThrown);
        }
    });

}
function mobileCheck() {
    var check = false;
    (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true })(navigator.userAgent || navigator.vendor || window.opera);
    return check;
}

const _MS_PER_DAY = 1000 * 60 * 60 * 24;

// a and b are javascript Date objects
function dateDiffInDays(a, b) {
    // Discard the time and time-zone information.
    const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

    return Math.floor((utc2 - utc1) / _MS_PER_DAY);
}