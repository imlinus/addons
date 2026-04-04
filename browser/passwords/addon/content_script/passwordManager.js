if (window.hasRun) {
  console.log("already running");
  /* return; */
}
window.hasRun = true;

async function getPassword(site, password) {
  let url = 'http://localhost:8080/get';

  let data = {
    site: site,
    master_password: password
  }

  let res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Sec-Fetch-Mode': 'no-cors'
    },
    body: JSON.stringify(data)
  });

  if (res.ok) {
    let result = await res.json();
    browser.runtime.sendMessage({password: result.password});
  }
  else {
    console.log(res);
  }
}

async function setPassword(site, password, masterPassword) {
  let url = 'http://localhost:8080/set';

  let data = {
    site: site,
    password: password,
    master_password: masterPassword
  }

  let res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (res.ok) {
    let result = await res.json();
    browser.runtime.sendMessage({status: result.status});
  }
  else {
    console.log(res);
  }
}

browser.runtime.onMessage.addListener((message) => {
  if (message.command == "get") {
    getPassword(message.site, message.masterPassword);
  }
  if (message.command == "set") {
    setPassword(message.site, message.password, message.masterPassword);
  }
});
