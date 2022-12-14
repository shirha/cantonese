  /* find UTF8; \([\x{4e00}-\x{9fff}]\) or \([\u4e00-\u9fff]\) */
  String.prototype.format = function () {
    return this.replace(/\{(\d+)\}/g, (m, n) => arguments[n] ); 
  };
  var template = '<BR><SPAN CLASS=k>{0}</SPAN><SPAN CLASS=s>{1}</SPAN><IMG SRC="ocrat/{2}.jpg"><BR>{3}({4}){5} {6}, {7}; {8}<br><br>',
      sentence = '{0} <span class="c">{1}</span>, {2}; {3}<br>'

soundManager.setup({ waitForWindowLoad: true, debugMode: false });
var module = {}, lshk = null, freq, content, contents, chars, toggle = true,
  audio = {}; audio.playlist = []; 

function playAudio(idx){
  if (audio.nowPlaying) {
    audio.nowPlaying.destruct();
  }

  audio.nowPlaying = soundManager.createSound({
    id: 'lshkAudio',
    url: "yale/" + audio.playlist[idx] + ".mp3",
    autoLoad: true,
    autoPlay: true,
    onfinish: function(){
      idx ++;
      if (idx < audio.playlist.length) {
        playAudio(idx);
      } else {
        audio.playlist = [];
      }
    }
  });
}

soundManager.onready(function() {
  var table = ''; //, words = {};
  for (var r = 0; r < lshk.finals.length; r++){
    var rhyme = lshk.finals[r].split(',');
    for (var c = 0; c < rhyme.length; c++){
      if (rhyme[c]){
        table += '<button>' + rhyme[c] + '</button>';
      } else {
        table += '<button class="invis"></button>';
    } }
    table += '<br>';
  }
  table = table.replace(/<button class="invis"><\/button>/,
    '<button class="left">&#9664;<\/button>' +
    '<button class="freq">8<\/button>' +
    '<button class="right">&#9654;<\/button>');
  table = table.replace(/<button class="invis"><\/button><br>$/,
    '<button id="fill"><\/button>' +
    '<button class="simp">义<\/button><br>'); // 义義
  
  $('#finals').html(table);

  $('#finals button').on('click', function(e){
    var clas = $(e.target).attr('class');
    if (clas === "left")
      freq = parseInt( $('.freq').text() ) - 1,
      $('.freq').text(freq > 0 ? freq : 8);
    if (clas === "right")
      freq = parseInt( $('.freq').text() ) + 1,
      $('.freq').text(freq < 9 ? freq : 1);
    if (clas === "simp") {
      toggle = !toggle;
     $('.simp').css('background-color', toggle ? '#E0B0FF' : 'lightgray').text(toggle ? '义' : '義');
      var key = $('#orange').text();
      if (key) { 
        getword(key);
        var id = $('.k').text();
        if (id) {
          homonyms(id);
    } } }
    if (clas) return false;

    var initials = lshk.initials.split(',');
    var table = '<button class="up">&#9650;</button>', i;
    for (i = 1; i < 20; i++){
      table += '<button class="purple">' + initials[i] + '</button>';
    }
    table += '<button id="blue">' + $(e.target).text() + '</button><br>';

    for (var tone = 1; tone < 7; tone++){
      for (i = 0; i < 20; i++){
        var word = initials[i] + $(e.target).text() + tone;
        if (word in lshk.yale) {
          table += '<button data-word="' + word + '">' + lshk.yale[word].length / 2 + '</button>';
        } else {
          table += '<button class="invis"></button>';
      } }
      table += '<button class="gray">' + tone + '</button><br>';
    } 
    $('#initials').html(table);
    $('#initials button.up').on('click', function (){
      document.getElementById('finals').scrollIntoView()
    });

    $('#initials button').on('click', function(e){
      var word = e.target.getAttribute("data-word");
      if (!word) return false;  //  button:not(.purple, .gray, #blue)
      getword(word);
      document.getElementById('homonyms').scrollIntoView();
    });
    document.getElementById('initials').scrollIntoView();
  });
  document.getElementById('finals').scrollIntoView();
});

function getword (word) {
  $('#homonyms').html(
    '<button class="up">&#9650;</button>' + 
    '<button id="orange">' + word + '</button><br>' +
    lshk.yale[word].match(/.\d/g).map(function(char){
    //return '<button>' + char[0] + '<sup>' + char[1] + '</sup></button>';
      return createbtn(char[0], lshk.dict[char[0]][1], toggle, char[1]);
    }).join('')
  );
  $('#homonyms button.up').on('click', function (){ 
    document.getElementById('initials').scrollIntoView()
  });

  $('#homonyms button:not(#orange):not(.up)').on('click', getid);
}
 
function getid (e) {
  var $el = $(e.target);
  homonyms( $el.data('id') || $el.text()[0] );
}

function homonyms (e) {
  content = $.extend([], lshk.dict[e]);

  content[6] = content[6].split(/\s+/).map(function(e){ // yale
    return '<span class="c">' + e + '</span>';
  }).join(' ');

  $('#contents').html( template.format( ...content )
    .replace(/<IMG SRC="ocrat\/.jpg">/, '')
  );
  if (toggle) $('.s').css('color', '#9900cc');
  if ( lshk.sent_hash[content[0]] ) {
    lshk.sent_hash[content[0]].forEach(function(e){ 
      contents = $.extend([], lshk.sent_array[e]), chars = []; var flag = true;
      if(contents[0].split('').every(function(e){ //return true;
        if (e === '(') flag = false;
        if (e === ')') flag = true;
        if (!flag || e.match(/[^\u4E00-\u9FFF]/)) {
          chars.push(e);
          return true;
        }
        try {var freq = lshk.dict[e][4];}
        catch (error) {console.log(e); freq = 1}
        if (flag && freq <= $('.freq').text()) {
          chars.push(createspan(e, lshk.dict[e][1], toggle, content[0])); 
          return true;
        }
        return false;
      })) {
        contents[0] = chars.join('');
        contents[1] = contents[1].replace(/`/g, '');
        $('#contents').append(sentence.format( ...contents ));
      }
    });
  }
  $('.v').on('click', getid);

  $('.c').on('click', function () {
    audio.playlist = $(this).text().split(/\s+/).map(function(char) {
      return char in lshk.mp3 ? char : '_chirp';
    });
    playAudio(0);
  });
  return false;
}

function createspan (trad, simp, toggle, content){
  var char = toggle ? simp || trad : trad;
  var data = char === trad ? '' : ' data-id="' + trad + '"'; // 不承认主义
  var result = content === trad ? char : '<span class="v"' + data + '>' + char + '</span>';
  //console.log(result);
  return result; 
}

function createbtn (trad, simp, toggle, freq){
  var char = toggle ? simp || trad : trad;
  var data = char === trad ? '' : ' data-id="' + trad + '"'; // 不承认主义
//var result = content === trad ? char : '<span class="v"' + data + '>' + char + '</span>';
  var result = '<button'+ data +'>' + char + '<sup>' + freq + '</sup></button>'
  //console.log(result);
  return result; 
}

