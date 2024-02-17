let id = document.getElementById("drawflow");
window.editor = new Drawflow(id);
editor.reroute = true;

const f = await fetch(`${API_URL}/api/artifacts/example/diagram`, {
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    }
})
const r = await f.json();

const dataToImport = r || {
    "drawflow": {
        "Home": {
            "data": {
            }
        }
    }
};

editor.on('nodeCreated', (id) => {
    const links =  document.querySelectorAll(`#node-${id} .drawflow_content_node .link`);
    links.forEach((item) => {
        const target = document.querySelector(`#node-${id} .outputs .${item.classList[1]}`);
        if(target != null) {
            const pos = item.getBoundingClientRect();
            const targetPos = target.getBoundingClientRect();
            target.style.top = `${pos.y - targetPos.y}px`;
            target.style.left = `${pos.x - targetPos.x}px`;
        }
    })
})

editor.start();
editor.import(dataToImport);

const nodesDictionary = {
    events: {
        artifacts: [
            {
                name: 'event.on_artifact_load',
                html: `<div><div class=\"title-box\">On Artifact Load</div></div>`,
                inputs: 0,
                outputs: 1,
                parse: function (node) {
                    return {
                        "Type": "event",
                        "Value": node.name,
                    }
                }
            }
        ],
        gameplay: [
            {
                name: 'event.on_spawn_falling_tree',
                html: `<div>
                    <div class=\"title-box\">On Spawn Falling Tree</div>
                    <p>Generated Values:</p>
                    <ul>
                        <li><b>- Position</b>: <i>Location</i></li>
                    </ul>
                </div>`,
                inputs: 0,
                outputs: 1,
                parse: function (node) {
                    return {
                        "Type": "event",
                        "Value": node.name,
                    }
                }
            }
        ]
    },
    conditions: {
        general: [
            {
                name: 'condition.general.equal',
                html: `<div><div class=\"title-box\">Equal</div></div>`,
                inputs: 1,
                outputs: 2,
                parse: function (node) {
                    console.log(node);
                    return {
                        "Type": "condition",
                        "Operation": "equal",
                        "Left": {
                            "Type": "value",
                            "DataType": "string",
                            "Value": "Example Value"
                        },
                        "Right": {
                            "Type": "variable",
                            "DataType": "string",
                            "Value": "title"
                        },
                        "TrueGoToId": node.outputs.output_1.connections?.[0]?.node ?? '',
                        "FalseGoToId": node.outputs.output_2.connections?.[0]?.node ?? '',
                    }
                }
            },
            {
                name: 'condition.general.not_equal',
                html: `<div><div class=\"title-box\">Not Equal</div></div>`,
                inputs: 1,
                outputs: 2
            },
        ],
        numeric: [
            {
                name: 'condition.numeric.less_than',
                html: `<div><div class=\"title-box\">Less Than</div></div>`,
                inputs: 1,
                outputs: 2
            },
            {
                name: 'condition.numeric.greater_than',
                html: `<div><div class=\"title-box\">Greater Than</div></div>`,
                inputs: 1,
                outputs: 2
            },
            {
                name: 'condition.numeric.less_than_or_equal',
                html: `<div><div class=\"title-box\">Less Than or Equal</div></div>`,
                inputs: 1,
                outputs: 2
            },
            {
                name: 'condition.numeric.greater_than_or_equal',
                html: `<div><div class=\"title-box\">Greater Than or Equal</div></div>`,
                inputs: 1,
                outputs: 2
            }
        ]
    },
    effects: {
        system: [
            {
                name: 'effects.system.set_variable',
                html: `<div><div class=\"title-box\">Set Variable</div></div>`,
                inputs: 1,
                outputs: 1
            },
            {
                name: 'effects.system.notify',
                html: `
                <div>
                  <div class="title-box">Notification</div>
                  <div class="box">
                    <p>Enter notification text</p>
                  <textarea data-theme="light" df-text>
                  </div>
                </div>
                `,
                data: { text: '' },
                inputs: 1,
                outputs: 1,
                parse: function (node) {
                    return {
                        "Value": node.data.text
                    }
                }
            }
        ],
        player: [
            {
                name: 'effects.player.teleport',
                html: `
                <div>
                  <div class="title-box">Teleport</div>
                  <div class="box">
                    <p>X</p>
                    <input type="number" placeholder="X" df-x/>
                    <p>Y</p>
                    <input type="number" placeholder="Y" df-y/>
                    <p>Z</p>
                    <input type="number" placeholder="Z" df-z/>
                  </div>
                </div>
                `,
                inputs: 1,
                outputs: 1,
                parse: function (node) {
                    return {
                        "ValueX": node.data.x,
                        "ValueY": node.data.y,
                        "ValueZ": node.data.z,
                    }
                }
            },
        ],
    },
    expressions: {
        gameplay: [
            {
                name: 'expressions.game.local_player',
                html: `<div><div class=\"title-box\">Local Player</div></div>`,
                inputs: 1,
                outputs: 1
            },
        ],
        general: [
            {
                name: 'expressions.general.position',
                html: `<div><div class=\"title-box\">Position</div></div>`,
                inputs: 1,
                outputs: 1
            },
        ]
    }
};

// Add nodes to the dropdown
const snakeToTitle = str => str.split('.').pop(0).replace(/_/g, ' ').replace(/\b\w/g, match => match.toUpperCase());
const nodesToDetails = (nodes, summaryName) => {
    const details = document.createElement('details');
    details.open = true;
    const summary = document.createElement('summary');
    summary.textContent = summaryName;
    details.appendChild(summary);
    const ul = document.createElement('ul');
    for (const node of nodes) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.draggable = true;
        a.setAttribute('data-node', node.name);
        a.addEventListener('dragstart', event => window.drag(event));
        a.innerHTML = snakeToTitle(node.name);
        li.appendChild(a);
        ul.appendChild(li);
    }
    details.appendChild(ul);
    return details;
}
const nodesList = document.querySelector('#nodes-list');
for (const key in nodesDictionary) {
    if (!nodesDictionary.hasOwnProperty(key)) {
        continue;
    }
    const sectionLi = document.createElement('li');
    if (Array.isArray(nodesDictionary[key])) {
        const nodes = nodesDictionary[key];
        const details = nodesToDetails(nodes, snakeToTitle(key));
        sectionLi.appendChild(details);
    } else {
        const details = document.createElement('details');
        details.open = true;
        const summary = document.createElement('summary');
        summary.textContent = snakeToTitle(key);
        details.appendChild(summary);
        const ul = document.createElement('ul');
        for (const subkey in nodesDictionary[key]) {
            const li = document.createElement('li');
            if (!nodesDictionary[key].hasOwnProperty(subkey)) {
                continue;
            }
            const nodes = nodesDictionary[key][subkey];
            const details = nodesToDetails(nodes, snakeToTitle(subkey));
            li.appendChild(details);
            ul.appendChild(li);
        }
        details.appendChild(ul);
        sectionLi.appendChild(details);
    }
    nodesList.appendChild(sectionLi);
}

const available_nodes = [];
for (const key in nodesDictionary) {
    if (!nodesDictionary.hasOwnProperty(key)) {
        continue;
    }
    if (Array.isArray(nodesDictionary[key])) {
        available_nodes.push(...nodesDictionary[key]);
    } else {
        for (const subkey in nodesDictionary[key]) {
            if (!nodesDictionary[key].hasOwnProperty(subkey)) {
                continue;
            }
            available_nodes.push(...nodesDictionary[key][subkey]);
        }
    }
}
window.available_nodes = available_nodes.map(val => ({
    name: val.name.trim(),
    html: val.html.trim(),
    data: val.data ? JSON.parse(JSON.stringify(val.data)) : {},
    inputs: parseInt(val.inputs),
    outputs: parseInt(val.outputs),
    parse: val.parse,
}));

const btnSaveArtifact = document.querySelector('#btn-save-artifact');
btnSaveArtifact.addEventListener('click', async () => {
    if (btnSaveArtifact.disabled) {
        return;
    }
    btnSaveArtifact.disabled = true;
    btnSaveArtifact.classList.add('btn-disabled');
    const result = {
        "Id": "example",
        "Name": "Example",
        "Description": "This is an example of a flow. It will show you how to use the flow editor and how to create a flow.",
        "Version": "1.0.0",
        "Author": "Example",
        "Website": "https://example.com",
        "Blocks": []
    };
    const data = editor.export();
    console.log(data);
    const nodes = Object.values(data.drawflow.Home.data);
    for (const node of nodes) {
        dictionary_loop:
        for (const key in nodesDictionary) {
            if (!nodesDictionary.hasOwnProperty(key)) {
                continue;
            }
            if (Array.isArray(nodesDictionary[key])) {
                for (const nodeBase of nodesDictionary[key]) {
                    if (node.name === nodeBase.name) {
                        if (!nodeBase.parse) {
                            btnSaveArtifact.disabled = false;
                            btnSaveArtifact.classList.remove('btn-disabled');
                            showError(`Node ${nodeBase.name} does not have a parse function`);
                            throw new Error(`Node ${nodeBase.name} does not have a parse function`);
                        }
                        const parsedNode = {
                            "Id": node.id.toString(),
                            "Type": node.name,
                            ...nodeBase.parse(node),
                        };
                        if (node?.inputs?.input_1?.connections?.[0]?.node) {
                            parsedNode['ParentId'] = node.inputs.input_1.connections[0].node;
                        }
                        result.Blocks.push(parsedNode);
                        break dictionary_loop;
                    }
                }
            } else {
                for (const subkey in nodesDictionary[key]) {
                    if (!nodesDictionary[key].hasOwnProperty(subkey)) {
                        continue;
                    }
                    for (const nodeBase of nodesDictionary[key][subkey]) {
                        if (node.name === nodeBase.name) {
                            if (!nodeBase.parse) {
                                btnSaveArtifact.disabled = false;
                                btnSaveArtifact.classList.remove('btn-disabled');
                                showError(`Node ${nodeBase.name} does not have a parse function`);
                                throw new Error(`Node ${nodeBase.name} does not have a parse function`);
                            }
                            const parsedNode = {
                                "Id": node.id.toString(),
                                "Type": node.name,
                                ...nodeBase.parse(node),
                            };
                            if (node?.inputs?.input_1?.connections?.[0]?.node) {
                                parsedNode['ParentId'] = node.inputs.input_1.connections[0].node;
                            }
                            result.Blocks.push(parsedNode);
                            break dictionary_loop;
                        }
                    }
                }
            }
        }
    }
    console.log();
    console.log(`\n/ / / / / / /\n`);
    console.log(`Blocks\n`);
    for (const block of result.Blocks) {
        console.log(block);
    }
    console.log(`\n/ / / / / / /\n`);
    const f = await fetch(`${API_URL}/api/artifacts/upload`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
            artifact_id: "example",
            code: JSON.stringify(result),
            diagram: JSON.stringify(data),
        }),
    });
    const r = await f.json();
    if (f.status !== 200) {
        console.error(r);
        btnSaveArtifact.disabled = false;
        btnSaveArtifact.classList.remove('btn-disabled');
        showError(r.error);
        return;
    }
    btnSaveArtifact.disabled = false;
    btnSaveArtifact.classList.remove('btn-disabled');
    showSuccess("Artifact uploaded successfully! use '<i>artifact.load example</i>' to load it");
});
