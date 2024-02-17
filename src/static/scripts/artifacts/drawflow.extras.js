/* DRAG EVENT */
/* Mouse and Touch Actions */
const elements = document.getElementsByClassName('drag-drawflow');
for (let i = 0; i < elements.length; i++) {
    elements[i].addEventListener('touchend', window.drop, false);
    elements[i].addEventListener('touchmove', window.positionMobile, false);
    elements[i].addEventListener('touchstart', window.drag, false);
}

// Variables
window.mobile_item_selec = '';
window.mobile_last_move = null;

// Methods
window.positionMobile = event => mobile_last_move = event;
window.allowDrop = ev => ev.preventDefault();
window.drag = event => {
    if (event.type === "touchstart") {
        mobile_item_selec = event.target.closest(".drag-drawflow").getAttribute('data-node');
    } else {
        event.dataTransfer.setData("node", event.target.getAttribute('data-node'));
    }
}
window.drop = event => {
    if (event.type === "touchend") {
        let parentdrawflow = document.elementFromPoint(mobile_last_move.touches[0].clientX, mobile_last_move.touches[0].clientY).closest("#drawflow");
        if (parentdrawflow != null) {
            addNodeToDrawFlow(mobile_item_selec, mobile_last_move.touches[0].clientX, mobile_last_move.touches[0].clientY);
        }
        mobile_item_selec = '';
    } else {
        event.preventDefault();
        let data = event.dataTransfer.getData("node");
        addNodeToDrawFlow(data, event.clientX, event.clientY);
    }
}
window.addNodeToDrawFlow = (name, pos_x, pos_y) => {
    if (editor.editor_mode === 'fixed') {
        return false;
    }
    pos_x = pos_x * (editor.precanvas.clientWidth / (editor.precanvas.clientWidth * editor.zoom)) - (editor.precanvas.getBoundingClientRect().x * (editor.precanvas.clientWidth / (editor.precanvas.clientWidth * editor.zoom)));
    pos_y = pos_y * (editor.precanvas.clientHeight / (editor.precanvas.clientHeight * editor.zoom)) - (editor.precanvas.getBoundingClientRect().y * (editor.precanvas.clientHeight / (editor.precanvas.clientHeight * editor.zoom)));

    for (let i = 0; i < window.available_nodes.length; i++) {
        if (window.available_nodes[i].name === name) {
            const val = window.available_nodes[i];
            const data = {
                name: val.name.trim(),
                html: val.html.trim(),
                data: val.data ? JSON.parse(JSON.stringify(val.data)) : {},
                inputs: parseInt(val.inputs),
                outputs: parseInt(val.outputs),
                parse: val.parse,
            };
            let node = editor.addNode(data.name, data.inputs, data.outputs, pos_x, pos_y, data.name, data.data, data.html);
            console.log('node added ', node);
            break;
        }
    }
}
window.changeModule = event => {
    let all = document.querySelectorAll(".menu ul li");
    for (let i = 0; i < all.length; i++) {
        all[i].classList.remove('selected');
    }
    event.target.classList.add('selected');
}
