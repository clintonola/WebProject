const tableLinksBody = document.getElementById('tableLinksBody')

function getWeblinks() {
  fetch('/getWeblinks')
    .then((response) => response.json())
    .then((data) => {
      console.log(data)
      let i = 0
      data.forEach(function (link) {
        const row = tableLinksBody.insertRow()
        const checkbox = row.insertCell(0)
        checkbox.innerHTML = `<input key=${i} onclick=updateWeblink(this) type=checkbox name=id value=${link.id} />`
        const name = row.insertCell(1)
        name.innerHTML = link.name
        const url = row.insertCell(2)
        url.innerHTML = `<a href=https://${link.url} >link</a>`
        i = i + 1
      })
    })
}
getWeblinks()

function updateWeblink(event) {
  const row = event.getAttribute('key')
  const cells = tableLinksBody.rows[row].cells
  const cell1 = cells[1].innerHTML
  const cell2 = cells[2].children[0]
  if (event.checked) {
    cells[1].innerHTML = `<input type=text name=name value="${cell1}" />`
    cells[2].innerHTML = `<input type=text name=url value="${cell2.href.replace(
      'https://',
      ''
    )}" />`
  } else {
    const input = cells[1].children[0]
    cells[1].innerHTML = input.value
    cells[2].innerHTML = `<a href=https://${cell2.value} >link</a>`
  }
}
