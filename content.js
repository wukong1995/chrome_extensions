function init() {
  const style = `<style>
  #buttonDiv {
    position: fixed;
    top: 0;
  }

  #buttonDiv > button {
    width: 40px;
    height: 40px;
    margin-right: 10px;
  }
  </style>`

  const $dom = $('<div id="buttonDiv"><button style="background-color: rgb(58, 167, 87);"></button><button style="background-color: rgb(232, 69, 60);"></button><button style="background-color: rgb(249, 187, 45);"></button><button style="background-color: rgb(70, 136, 241);"></button></div>')
  $dom.find('button')
    .on('click', function () {
      const color = this.style.backgroundColor;
      document.body.style.backgroundColor = color;
    })

  $('head').append(style);
  $dom.appendTo($('body'));
}

init()