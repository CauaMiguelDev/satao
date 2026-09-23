(function () {
  "use strict";

  var cfg = window.SATAO_SUPABASE;
  var sb = cfg && window.supabase ? window.supabase.createClient(cfg.url, cfg.anonKey) : null;

  var loginView = document.getElementById("admin-login");
  var appView = document.getElementById("admin-app");
  var loginForm = document.getElementById("login-form");
  var loginStatus = loginForm.querySelector(".form-status");
  var logoutBtn = document.getElementById("logout-btn");

  function setStatus(el, state, msg) {
    if (!el) return;
    el.setAttribute("data-state", state);
    el.textContent = msg || "";
  }

  function showLogin(message) {
    appView.hidden = true;
    loginView.hidden = false;
    if (message) setStatus(loginStatus, "error", message);
  }

  function showApp() {
    loginView.hidden = true;
    appView.hidden = false;
    loadTab(currentTab);
  }

  if (!sb) {
    setStatus(loginStatus, "error", "Painel indisponível: configure supabase-config.js.");
  } else {
    loginForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var data = new FormData(loginForm);
      var btn = loginForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      setStatus(loginStatus, "loading", "Entrando…");
      sb.auth
        .signInWithPassword({ email: data.get("email"), password: data.get("password") })
        .then(function (res) {
          if (res.error) throw res.error;
        })
        .catch(function () {
          setStatus(loginStatus, "error", "E-mail ou senha inválidos.");
        })
        .finally(function () {
          btn.disabled = false;
        });
    });

    logoutBtn.addEventListener("click", function () {
      sb.auth.signOut();
    });

    sb.auth.onAuthStateChange(function (event, session) {
      if (!session) {
        showLogin();
        return;
      }
      sb.rpc("is_admin").then(function (res) {
        if (res.error || res.data !== true) {
          sb.auth.signOut();
          showLogin("Esta conta não tem acesso ao painel.");
          return;
        }
        loginForm.reset();
        setStatus(loginStatus, "idle", "");
        showApp();
      });
    });
  }

  /* ---- Abas ---- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".admin-tab"));
  var panels = Array.prototype.slice.call(document.querySelectorAll(".admin-panel"));
  var currentTab = "reviews";
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) {
        t.classList.toggle("is-active", t === tab);
        t.setAttribute("aria-selected", t === tab ? "true" : "false");
      });
      panels.forEach(function (p) {
        p.hidden = p.getAttribute("data-panel") !== tab.getAttribute("data-tab");
      });
      currentTab = tab.getAttribute("data-tab");
      loadTab(currentTab);
    });
  });
  function loadTab(name) {
    if (name === "reviews") loadReviews();
    else if (name === "photos") loadPhotos();
    else if (name === "agenda") loadAgenda();
    else if (name === "gallery") loadGallery();
  }

  /* ---- Avaliações ---- */
  function loadReviews() {
    var panel = document.querySelector('[data-panel="reviews"]');
    var msg = panel.querySelector(".admin-msg");
    var list = panel.querySelector(".admin-list");
    setStatus(msg, "loading", "Carregando…");
    list.hidden = true;
    list.innerHTML = "";
    sb.from("reviews")
      .select("*")
      .order("created_at", { ascending: false })
      .then(function (res) {
        if (res.error) throw res.error;
        var rows = res.data || [];
        if (!rows.length) {
          setStatus(msg, "empty", "Nenhuma avaliação recebida ainda.");
          return;
        }
        msg.hidden = true;
        list.hidden = false;
        rows.forEach(function (row) {
          var item = document.createElement("article");
          item.className = "admin-row";
          item.innerHTML =
            '<div class="admin-row-main">' +
            "<strong>" + "★".repeat(row.rating) + "☆".repeat(5 - row.rating) + "</strong> " +
            '<span class="admin-row-name"></span>' +
            '<p class="admin-row-comment"></p>' +
            '<span class="admin-badge"></span>' +
            "</div>" +
            '<div class="admin-row-actions">' +
            '<button type="button" data-action="toggle" class="button button-outline"></button>' +
            '<button type="button" data-action="delete" class="button button-outline">Excluir</button>' +
            "</div>";
          item.querySelector(".admin-row-name").textContent = row.name ? "· " + row.name : "";
          item.querySelector(".admin-row-comment").textContent = row.comment || "";
          item.querySelector(".admin-badge").textContent = row.approved ? "Aprovada" : "Pendente";
          item.querySelector('[data-action="toggle"]').textContent = row.approved ? "Reprovar" : "Aprovar";
          item.querySelector('[data-action="toggle"]').addEventListener("click", function () {
            sb.from("reviews").update({ approved: !row.approved }).eq("id", row.id).then(function (r) {
              if (!r.error) loadReviews();
            });
          });
          item.querySelector('[data-action="delete"]').addEventListener("click", function () {
            if (!window.confirm("Excluir esta avaliação?")) return;
            sb.from("reviews").delete().eq("id", row.id).then(function (r) {
              if (!r.error) loadReviews();
            });
          });
          list.appendChild(item);
        });
      })
      .catch(function () {
        setStatus(msg, "error", "Não foi possível carregar as avaliações.");
      });
  }

  /* ---- Fotos da comunidade ---- */
  function loadPhotos() {
    var panel = document.querySelector('[data-panel="photos"]');
    var msg = panel.querySelector(".admin-msg");
    var grid = panel.querySelector(".admin-grid");
    setStatus(msg, "loading", "Carregando…");
    grid.hidden = true;
    grid.innerHTML = "";
    sb.from("community_photos")
      .select("*")
      .order("created_at", { ascending: false })
      .then(function (res) {
        if (res.error) throw res.error;
        var rows = res.data || [];
        if (!rows.length) {
          setStatus(msg, "empty", "Nenhuma foto enviada ainda.");
          return;
        }
        msg.hidden = true;
        grid.hidden = false;
        rows.forEach(function (row) {
          var card = document.createElement("article");
          card.className = "admin-card";
          var img = document.createElement("img");
          img.src = sb.storage.from("community-photos").getPublicUrl(row.thumb_path).data.publicUrl;
          img.alt = row.caption || "";
          card.appendChild(img);
          var meta = document.createElement("div");
          meta.className = "admin-card-meta";
          meta.innerHTML =
            "<p></p>" +
            '<span class="admin-badge"></span>' +
            '<div class="admin-row-actions">' +
            '<button type="button" data-action="approve" class="button button-outline">Aprovar</button>' +
            '<button type="button" data-action="reject" class="button button-outline">Reprovar</button>' +
            '<button type="button" data-action="delete" class="button button-outline">Excluir</button>' +
            "</div>";
          meta.querySelector("p").textContent = [row.caption, row.author_name].filter(Boolean).join(" · ") || "(sem legenda)";
          meta.querySelector(".admin-badge").textContent = row.status;
          meta.querySelector('[data-action="approve"]').addEventListener("click", function () {
            sb.from("community_photos").update({ status: "approved" }).eq("id", row.id).then(function (r) {
              if (!r.error) loadPhotos();
            });
          });
          meta.querySelector('[data-action="reject"]').addEventListener("click", function () {
            sb.from("community_photos").update({ status: "rejected" }).eq("id", row.id).then(function (r) {
              if (!r.error) loadPhotos();
            });
          });
          meta.querySelector('[data-action="delete"]').addEventListener("click", function () {
            if (!window.confirm("Excluir esta foto (e o arquivo) permanentemente?")) return;
            sb.storage
              .from("community-photos")
              .remove([row.image_path, row.thumb_path])
              .then(function () {
                return sb.from("community_photos").delete().eq("id", row.id);
              })
              .then(function (r) {
                if (!r || !r.error) loadPhotos();
              });
          });
          card.appendChild(meta);
          grid.appendChild(card);
        });
      })
      .catch(function () {
        setStatus(msg, "error", "Não foi possível carregar as fotos.");
      });
  }

  /* ---- Agenda ---- */
  var agendaForm = document.getElementById("agenda-form");
  var agendaCancel = document.getElementById("agenda-cancel");
  var agendaStatus = agendaForm.querySelector(".form-status");

  function resetAgendaForm() {
    agendaForm.reset();
    agendaForm.querySelector('[name="id"]').value = "";
    agendaCancel.hidden = true;
  }

  agendaForm.addEventListener("submit", function (event) {
    event.preventDefault();
    var data = new FormData(agendaForm);
    var id = data.get("id");
    var payload = {
      title: (data.get("title") || "").toString().trim(),
      event_date: data.get("event_date") || null,
      location: (data.get("location") || "").toString().trim() || null,
      description: (data.get("description") || "").toString().trim() || null,
      published: agendaForm.querySelector('[name="published"]').checked,
      sort_order: parseInt(data.get("sort_order"), 10) || 0,
    };
    if (!payload.title) {
      setStatus(agendaStatus, "error", "Título é obrigatório.");
      return;
    }
    setStatus(agendaStatus, "loading", "Salvando…");
    var query = id ? sb.from("agenda_items").update(payload).eq("id", id) : sb.from("agenda_items").insert(payload);
    query
      .then(function (res) {
        if (res.error) throw res.error;
        resetAgendaForm();
        setStatus(agendaStatus, "success", "Salvo.");
        loadAgenda();
      })
      .catch(function () {
        setStatus(agendaStatus, "error", "Não foi possível salvar.");
      });
  });
  agendaCancel.addEventListener("click", resetAgendaForm);

  function loadAgenda() {
    var panel = document.querySelector('[data-panel="agenda"]');
    var msg = panel.querySelector(".admin-msg");
    var list = panel.querySelector(".admin-list");
    setStatus(msg, "loading", "Carregando…");
    list.hidden = true;
    list.innerHTML = "";
    sb.from("agenda_items")
      .select("*")
      .order("sort_order", { ascending: true })
      .then(function (res) {
        if (res.error) throw res.error;
        var rows = res.data || [];
        if (!rows.length) {
          setStatus(msg, "empty", "Nenhum item de agenda cadastrado.");
          return;
        }
        msg.hidden = true;
        list.hidden = false;
        rows.forEach(function (row) {
          var item = document.createElement("article");
          item.className = "admin-row";
          item.innerHTML =
            '<div class="admin-row-main">' +
            "<strong></strong>" +
            "<p></p>" +
            '<span class="admin-badge"></span>' +
            "</div>" +
            '<div class="admin-row-actions">' +
            '<button type="button" data-action="edit" class="button button-outline">Editar</button>' +
            '<button type="button" data-action="delete" class="button button-outline">Excluir</button>' +
            "</div>";
          item.querySelector("strong").textContent = row.title;
          item.querySelector("p").textContent = [row.event_date, row.location].filter(Boolean).join(" · ");
          item.querySelector(".admin-badge").textContent = row.published ? "Publicado" : "Rascunho";
          item.querySelector('[data-action="edit"]').addEventListener("click", function () {
            agendaForm.querySelector('[name="id"]').value = row.id;
            agendaForm.querySelector('[name="title"]').value = row.title || "";
            agendaForm.querySelector('[name="event_date"]').value = row.event_date || "";
            agendaForm.querySelector('[name="location"]').value = row.location || "";
            agendaForm.querySelector('[name="description"]').value = row.description || "";
            agendaForm.querySelector('[name="published"]').checked = !!row.published;
            agendaForm.querySelector('[name="sort_order"]').value = row.sort_order || 0;
            agendaCancel.hidden = false;
            agendaForm.scrollIntoView({ behavior: "smooth" });
          });
          item.querySelector('[data-action="delete"]').addEventListener("click", function () {
            if (!window.confirm("Excluir este item da agenda?")) return;
            sb.from("agenda_items").delete().eq("id", row.id).then(function (r) {
              if (!r.error) loadAgenda();
            });
          });
          list.appendChild(item);
        });
      })
      .catch(function () {
        setStatus(msg, "error", "Não foi possível carregar a agenda.");
      });
  }

  /* ---- Galeria oficial ---- */
  var GALLERY_BUCKET = "gallery";
  var GALLERY_ALLOWED_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
  var GALLERY_MAX_BYTES = 8 * 1024 * 1024;

  function uuid() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0, v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  var galleryForm = document.getElementById("gallery-form");
  var galleryCancel = document.getElementById("gallery-cancel");
  var galleryStatus = galleryForm.querySelector(".form-status");
  var galleryCurrentPath = ""; // caminho da imagem atual quando em edição

  function resetGalleryForm() {
    galleryForm.reset();
    galleryForm.querySelector('[name="id"]').value = "";
    galleryCurrentPath = "";
    galleryCancel.hidden = true;
  }

  galleryForm.addEventListener("submit", function (event) {
    event.preventDefault();
    var data = new FormData(galleryForm);
    var id = data.get("id");
    var file = galleryForm.querySelector('[name="image"]').files[0];

    if (!id && !file) {
      setStatus(galleryStatus, "error", "Escolha uma imagem.");
      return;
    }
    if (file) {
      var ext = GALLERY_ALLOWED_TYPES[file.type];
      if (!ext) {
        setStatus(galleryStatus, "error", "Formato inválido. Use JPG, PNG ou WEBP.");
        return;
      }
      if (file.size > GALLERY_MAX_BYTES) {
        setStatus(galleryStatus, "error", "Arquivo maior que 8 MB.");
        return;
      }
    }

    var payload = {
      title: (data.get("title") || "").toString().trim(),
      category: data.get("category"),
      published: galleryForm.querySelector('[name="published"]').checked,
      sort_order: parseInt(data.get("sort_order"), 10) || 0,
    };
    if (!payload.title) {
      setStatus(galleryStatus, "error", "Título é obrigatório.");
      return;
    }

    var btn = galleryForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    setStatus(galleryStatus, "loading", "Salvando…");

    var uploadStep = Promise.resolve(null);
    if (file) {
      var path = "items/" + uuid() + "." + GALLERY_ALLOWED_TYPES[file.type];
      uploadStep = sb.storage
        .from(GALLERY_BUCKET)
        .upload(path, file, { contentType: file.type })
        .then(function (res) {
          if (res.error) throw res.error;
          return path;
        });
    }

    uploadStep
      .then(function (newPath) {
        if (newPath) payload.image_path = newPath;
        var oldPath = newPath && galleryCurrentPath ? galleryCurrentPath : null;
        var query = id ? sb.from("gallery_items").update(payload).eq("id", id) : sb.from("gallery_items").insert(payload);
        return query.then(function (res) {
          if (res.error) throw res.error;
          if (oldPath) sb.storage.from(GALLERY_BUCKET).remove([oldPath]); // limpa a imagem antiga trocada na edição
        });
      })
      .then(function () {
        resetGalleryForm();
        setStatus(galleryStatus, "success", "Salvo.");
        loadGallery();
      })
      .catch(function () {
        setStatus(galleryStatus, "error", "Não foi possível salvar.");
      })
      .finally(function () {
        btn.disabled = false;
      });
  });
  galleryCancel.addEventListener("click", resetGalleryForm);

  function loadGallery() {
    var panel = document.querySelector('[data-panel="gallery"]');
    var msg = panel.querySelector(".admin-msg");
    var grid = panel.querySelector(".admin-grid");
    setStatus(msg, "loading", "Carregando…");
    grid.hidden = true;
    grid.innerHTML = "";
    sb.from("gallery_items")
      .select("*")
      .order("sort_order", { ascending: true })
      .then(function (res) {
        if (res.error) throw res.error;
        var rows = res.data || [];
        if (!rows.length) {
          setStatus(msg, "empty", "Nenhum item de galeria cadastrado.");
          return;
        }
        msg.hidden = true;
        grid.hidden = false;
        rows.forEach(function (row) {
          var card = document.createElement("article");
          card.className = "admin-card";
          var img = document.createElement("img");
          img.src = sb.storage.from(GALLERY_BUCKET).getPublicUrl(row.image_path).data.publicUrl;
          img.alt = row.title || "";
          card.appendChild(img);
          var meta = document.createElement("div");
          meta.className = "admin-card-meta";
          meta.innerHTML =
            "<p></p>" +
            '<span class="admin-badge"></span>' +
            '<div class="admin-row-actions">' +
            '<button type="button" data-action="edit" class="button button-outline">Editar</button>' +
            '<button type="button" data-action="delete" class="button button-outline">Excluir</button>' +
            "</div>";
          meta.querySelector("p").textContent = row.title + " · " + row.category;
          meta.querySelector(".admin-badge").textContent = row.published ? "Publicado" : "Rascunho";
          meta.querySelector('[data-action="edit"]').addEventListener("click", function () {
            galleryForm.querySelector('[name="id"]').value = row.id;
            galleryForm.querySelector('[name="title"]').value = row.title || "";
            galleryForm.querySelector('[name="category"]').value = row.category || "murais";
            galleryForm.querySelector('[name="published"]').checked = !!row.published;
            galleryForm.querySelector('[name="sort_order"]').value = row.sort_order || 0;
            galleryForm.querySelector('[name="image"]').value = "";
            galleryCurrentPath = row.image_path;
            galleryCancel.hidden = false;
            galleryForm.scrollIntoView({ behavior: "smooth" });
          });
          meta.querySelector('[data-action="delete"]').addEventListener("click", function () {
            if (!window.confirm("Excluir este item da galeria (e o arquivo) permanentemente?")) return;
            sb.storage
              .from(GALLERY_BUCKET)
              .remove([row.image_path])
              .then(function () {
                return sb.from("gallery_items").delete().eq("id", row.id);
              })
              .then(function (r) {
                if (!r || !r.error) loadGallery();
              });
          });
          card.appendChild(meta);
          grid.appendChild(card);
        });
      })
      .catch(function () {
        setStatus(msg, "error", "Não foi possível carregar a galeria.");
      });
  }
})();
