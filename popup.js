// let changeColor = document.getElementById('changeColor');

// chrome.storage.sync.get('color', function (data) {
//   changeColor.style.backgroundColor = data.color;
//   changeColor.setAttribute('value', data.color);
// });

// // chrome.storage.sync.set({ color: item }, function () {
// //   console.log('color is', item)
// // })

// changeColor.onclick = function (element) {
//   let color = element.target.value;

//   document.body.style.backgroundColor = color

//   // chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
//   //   chrome.tabs.executeScript(
//   //     tabs[0].id,
//   //     { code: 'document.body.style.backgroundColor = "' + color + '";' });
//   // });
// }

;(function() {
  // 存储地址列表
  let addressList = []
  const $targetList = $('#target-list')

  const changeAddressList = (targetList, cb) => {
    addressList = targetList
    const html = targetList.map((item, index) => `<div>
      <label><input type="radio" name="target" value="${index}" /> ${item.name}</label> 
      [<span class="address-delete js-address-delete" data-index="${index}"> del </span>]
      </div>`)
    $targetList.html(html)
    chrome.storage.sync.set({ targetList }, function () {
      cb && cb()
    })
  }

  const defaultData = {
    name: '',
    bucket: '',
    accessKeyId: '',
    accessKeySecret: '',
    prefix: '',
    refresh: false
  }

  chrome.storage.sync.get('targetList', function (data) {
    changeAddressList(data.targetList || [])
  });

  // helper function--------start
  const readFileAsync = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      resolve(reader.result)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const filterFile = (files) => {
    const acceptList = ['.jpeg', '.jpg', '.png', '.bmp',]
    const list = []

    for (const file of files) {
      const fileName = file.name.toLowerCase()

      for (const suffix of acceptList) {
        if (fileName.endsWith(suffix)) {
          list.push(file)
          break
        }
      }
    }

    return list
  }

  const uploadFile = (targetAddress, file, fileName) => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file, 'wpp_test/' + fileName);
      formData.append('ossConfig', targetAddress)

      $.ajax({
        url: '/upload',
        type: 'POST',
        data: formData,
      }).done((res) => {
        resolve(res);
      }).fail((error) => {
        reject(error)
      });
    })
  }
  // helper function--------end

  $targetList.on('click', '.js-address-delete', (event) => {
    const target = event.target
    const index = target.dataset.index

    changeAddressList([
      ...addressList.slice(0, index),
      ...addressList.slice(index + 1)
    ])
  })

  const getCurrentAddress = () => {
    const inputValue = $('input[name="target"]').val()

    if (/[0-9]+/.test(inputValue)) {
      return addressList[inputValue]
    }

    return undefined
  }

  // modal----------start
  const $modal = $('#modal')
  const $inputName = $('#input-name')
  const $inputBucket = $('#input-bucket')
  const $inputAccess = $('#input-access')
  const $inputSecret = $('#input-secret')
  const $inputPrefix = $('#input-prefix')
  const $inputFresh = $('#input-refresh')

  var openModal = (initData = defaultData) => {
    const { bucket, accessKeyId, accessKeySecret, prefix, refresh, name } = initData
    $inputName.val(name)
    $inputBucket.val(bucket)
    $inputAccess.val(accessKeyId)
    $inputSecret.val(accessKeySecret)
    $inputPrefix.val(prefix)
    $inputFresh[0].checked = refresh

    $modal.addClass('t-show')
  }

  const closeModal = () => {
    $modal.removeClass('t-show')
  }

  $('.js-close-modal').on('click', () => {
    closeModal()
  })

  $('.js-open-modal').on('click', () => {
    openModal()
  })

  $('#js-modal-submit').on('click', () => {
    const name = $inputName.val()
    const bucket = $inputBucket.val()
    const accessKeyId = $inputAccess.val()
    const accessKeySecret = $inputSecret.val()
    const prefix = $inputPrefix.val()
    const refresh = $inputFresh[0].checked

    if (!bucket || !accessKeyId || !accessKeySecret || !prefix) {
      alert('信息填写不完整')
      return
    }

    // checkData
    if (!prefix.endsWith('/')) {
      alert('文件夹路径必须以/结尾')
      return
    }

    addressList.push({
      name,
      bucket,
      accessKeyId,
      accessKeySecret,
      prefix,
      refresh
    })

    changeAddressList(addressList, closeModal)
  })
  // modal----------end

  // upload----------start
  const $drop = $('#dropzone');
  const $dropBody = $('#dz-body');
  const $dropMessage = $('#dz-message');
  const $input = $('#input');
  const $result = $('#result');

  // 图片的列表
  // const imgList = []

  const addImgsToList = (imgs, files) => {
    $dropMessage.css('display', 'none')
    const html = imgs.map((base64, index) => `<div class="dz-item">
      <img src="${base64}" height="80" />
      <div>${files[index].name}</div>
    </div>`)
    $dropBody.append(html)
    // imgList = [...imgList, ...imgs]
  }

  const uploadSuccess = (urlList) => {
    $result.append(urlList.map(url => `<div>${url}</div>`))
  }

  const resolveFiles = async (files) => {
    if (!files || files.length === 0) {
      return
    }

    const promiseAll = []
    const targetAddress = getCurrentAddress()
    const urlPrefix = targetAddress && targetAddress.prefix || '/'

    try {
      for (const file of files) {
        promiseAll.push(readFileAsync(file))
      }

      const base64List = await Promise.all(promiseAll)
      addImgsToList(base64List, files)

      const resList = []
      for (let i = 0; i < files.length; i++) {
        try {
          const file = files[i]
          const fileName = file.name
          const res = await uploadFile(targetAddress, file, urlPrefix + fileName)
          resList.push(res.imgUrl)
        } catch (error) {
          resList.push('上传失败，请重试')
          console.error('上传图片出错', error)
        }
      }
      uploadSuccess(resList)
    } catch (error) {
      console.error('处理图片失败', error)
    }
  }

  $input
    .on('click', function(event) {
      event.stopPropagation()
    })
    .on('change', function(event) {
      resolveFiles(event.target.files);
    })

  $drop
    .on('click', function() {
      $input.click()
    })
    .on('dropover', function(event) {
      event.preventDefault()
    })
    .on('dropleave', function() {
      event.preventDefault()
    })
    .on('drop', function(event) {
      event.preventDefault()
      
      const { files } = event.dataTransfer
      resolveFiles(filterFile(files))
    })
  // input----------end
})()