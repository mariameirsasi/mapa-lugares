window.FLOOR = { w: 1520, h: 642 };

window.SECTORS = {
  comercial: { label: 'Comercial', color: '#2563EB', soft: '#E8EFFD' },
  marketing: { label: 'Marketing', color: '#EA580C', soft: '#FCEDE4' },
  juridico:  { label: 'Jurídico',  color: '#7C3AED', soft: '#F0EAFB' },
  tecnico:   { label: 'Técnico',   color: '#0D9488', soft: '#E2F2F0' },
};

window.DESKS = (function () {
  var list = [];
  var start = 22, step = 150, y = 40;
  for (var i = 0; i < 10; i++) {
    var id = 'M' + String(i + 1).padStart(2, '0');
    list.push({ id: id, label: 'Mesa ' + String(i + 1).padStart(2, '0'), x: start + i * step, y: y });
  }
  var gx = 240, gy = 404, gstep = 227;
  ['A', 'B', 'C', 'D'].forEach(function (L, i) {
    list.push({ id: 'SV' + L, label: String(11 + i), x: gx + i * gstep, y: gy, small: true });
  });
  return list;
})();

window.COLUMNS = [
  { x: 230, y: 324 }, { x: 600, y: 324 }, { x: 1080, y: 324 }, { x: 1430, y: 324 },
];

window.ZONES = [
  { id: 'corredor',   label: 'Corredor',      kind: 'corridor',  x: 22,   y: 298, w: 1476, h: 52  },
  { id: 'gerencia',   label: 'Gerência',       kind: 'office',    x: 22,   y: 374, w: 176,  h: 244 },
  { id: 'sala-vidro', label: 'Sala de Vidro',  kind: 'glassroom', x: 214,  y: 374, w: 1000, h: 244 },
  { id: 'boothA',     label: 'Sala A',         kind: 'booth',     x: 1090, y: 392, w: 104,  h: 46  },
  { id: 'boothB',     label: 'Sala B',         kind: 'booth',     x: 1090, y: 446, w: 104,  h: 46  },
  { id: 'boothC',     label: 'Sala C',         kind: 'booth',     x: 1090, y: 500, w: 104,  h: 46  },
  { id: 'boothD',     label: 'Sala D',         kind: 'booth',     x: 1090, y: 554, w: 104,  h: 46  },
  { id: 'copa',       label: 'Copa',           kind: 'room',      x: 1238, y: 374, w: 130,  h: 244 },
  { id: 'entrada',    label: 'Entrada',        kind: 'door',      x: 1368, y: 374, w: 130,  h: 244 },
];

window.WINDOWS = [{ side: 'top', x: 18, y: 0, w: 1484, h: 12 }];

window.seatLayout = function (desk) {
  if (desk.small) {
    var W = 138, H = 212;
    var surf = { left: 47, top: 24, width: 44, height: 164 };
    var colL = desk.x + 26, colR = desk.x + W - 26;
    var ys = [desk.y + 54, desk.y + 106, desk.y + 158];
    var seats = [];
    ys.forEach(function (cy, i) { seats.push({ n: i + 1, cx: colL, cy: cy, side: 'l' }); });
    ys.forEach(function (cy, i) { seats.push({ n: i + 4, cx: colR, cy: cy, side: 'r' }); });
    return { W: W, H: H, surf: surf, seats: seats, small: true };
  }
  var W = 138, H = 244;
  var surf = { left: 46, top: 28, width: 46, height: 188 };
  var colL = desk.x + 26, colR = desk.x + W - 26;
  var ys = [desk.y + 64, desk.y + 124, desk.y + 184];
  var seats = [];
  ys.forEach(function (cy, i) { seats.push({ n: i + 1, cx: colL, cy: cy, side: 'l' }); });
  ys.forEach(function (cy, i) { seats.push({ n: i + 4, cx: colR, cy: cy, side: 'r' }); });
  return { W: W, H: H, surf: surf, seats: seats, small: false };
};
