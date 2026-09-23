(function () {
  "use strict";

  var BUCKET = "community-photos";
  var MAX_BYTES = 8 * 1024 * 1024;
  var MIN_DIM = 480;
  var THUMB_DIM = 480;
  var ALLOWED_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

  function t(key, fallbackPt) {
    var lang = window.SATAO_LANG || "pt";
    if (lang === "pt") return fallbackPt;
    var dict = window.SATAO_I18N && window.SATAO_I18N[lang];
    return (dict && dict[key]) || fallbackPt;
  }

  var client = null;
  function getClient() {
    if (client) return client;
    var cfg = window.SATAO_SUPABASE;
    if (!cfg || !cfg.url || !window.supabase) return null;
    client = window.supabase.createClient(cfg.url, cfg.anonKey);
    return client;
  }

  function uuid() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0, v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function clientToken() {
    var key = "satao-client-token";
    try {
      var existing = localStorage.getItem(key);
      if (existing) return existing;
      var fresh = uuid();
      localStorage.setItem(key, fresh);
      return fresh;
    } catch (e) {
      return uuid();
    }
  }

  function setStatus(el, state, message) {
    if (!el) return;
    el.setAttribute("data-state", state);
    el.textContent = message || "";
  }

  function readImage(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () { resolve({ img: img, url: url }); };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("decode")); };
      img.src = url;
    });
  }

  function makeThumbnail(img) {
    var scale = Math.min(1, THUMB_DIM / Math.max(img.naturalWidth, img.naturalHeight));
    var w = Math.round(img.naturalWidth * scale);
    var h = Math.round(img.naturalHeight * scale);
    var canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d").drawImage(img, 0, 0, w, h);
    return new Promise(function (resolve) {
      canvas.toBlob(function (blob) { resolve(blob); }, "image/jpeg", 0.82);
    });
  }

  function publicUrl(sb, bucket, path) {
    return sb.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }

  /* ---- Formulário: enviar foto ---- */
  var photoForm = document.getElementById("community-photo-form");
  if (photoForm) {
    photoForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var statusEl = photoForm.querySelector(".form-status");
      var sb = getClient();
      if (!sb) {
        setStatus(statusEl, "error", t("community.status.unavailable", "Envio indisponível no momento. Tente novamente mais tarde."));
        return;
      }
      var data = new FormData(photoForm);
      if (data.get("website")) return; // honeypot: bot preencheu campo escondido, ignora silenciosamente

      var file = photoForm.querySelector('input[name="photo"]').files[0];
      if (!file) {
        setStatus(statusEl, "error", t("community.status.noFile", "Escolha uma foto para enviar."));
        return;
      }
      var ext = ALLOWED_TYPES[file.type];
      if (!ext) {
        setStatus(statusEl, "error", t("community.status.badType", "Formato inválido. Use JPG, PNG ou WEBP."));
        return;
      }
      if (file.size > MAX_BYTES) {
        setStatus(statusEl, "error", t("community.status.tooBig", "Arquivo maior que 8 MB."));
        return;
      }
      if (!photoForm.querySelector('input[name="consent"]').checked) {
        setStatus(statusEl, "error", t("community.status.noConsent", "É preciso autorizar o uso da imagem."));
        return;
      }

      var submitBtn = photoForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      setStatus(statusEl, "loading", t("community.status.sending", "Enviando…"));

      var caption = (data.get("caption") || "").toString().trim().slice(0, 140);
      var author = (data.get("author") || "").toString().trim().slice(0, 60);
      var id = uuid();
      var token = clientToken();

      readImage(file)
        .then(function (loaded) {
          if (Math.min(loaded.img.naturalWidth, loaded.img.naturalHeight) < MIN_DIM) {
            URL.revokeObjectURL(loaded.url);
            throw { code: "small", message: t("community.status.tooSmall", "Imagem muito pequena (mínimo " + MIN_DIM + "px).") };
          }
          return makeThumbnail(loaded.img).then(function (thumbBlob) {
            URL.revokeObjectURL(loaded.url);
            return thumbBlob;
          });
        })
        .then(function (thumbBlob) {
          var imagePath = "pending/" + id + "." + ext;
          var thumbPath = "pending/" + id + "-thumb.jpg";
          return sb.storage.from(BUCKET).upload(imagePath, file, { contentType: file.type })
            .then(function (res) { if (res.error) throw res.error; return sb.storage.from(BUCKET).upload(thumbPath, thumbBlob, { contentType: "image/jpeg" }); })
            .then(function (res) { if (res.error) throw res.error; return { imagePath: imagePath, thumbPath: thumbPath }; });
        })
        .then(function (paths) {
          return sb.from("community_photos").insert({
            image_path: paths.imagePath,
            thumb_path: paths.thumbPath,
            caption: caption || null,
            author_name: author || null,
            consent: true,
            client_token: token,
          });
        })
        .then(function (res) {
          if (res.error) throw res.error;
          photoForm.reset();
          setStatus(statusEl, "success", t("community.status.sent", "Foto enviada! Ela aparece aqui assim que for aprovada."));
        })
        .catch(function (err) {
          var message = err && err.code === "small" ? err.message : t("community.status.error", "Não foi possível enviar. Tente novamente.");
          setStatus(statusEl, "error", message);
        })
        .finally(function () {
          submitBtn.disabled = false;
        });
    });
  }

  /* ---- Formulário: avaliar o site ---- */
  var reviewForm = document.getElementById("review-form");
  if (reviewForm) {
    reviewForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var statusEl = reviewForm.querySelector(".form-status");
      var sb = getClient();
      if (!sb) {
        setStatus(statusEl, "error", t("review.status.unavailable", "Envio indisponível no momento. Tente novamente mais tarde."));
        return;
      }
      var data = new FormData(reviewForm);
      if (data.get("website")) return; // honeypot

      var rating = parseInt(data.get("rating"), 10);
      if (!rating || rating < 1 || rating > 5) {
        setStatus(statusEl, "error", t("review.status.noRating", "Escolha uma nota de 1 a 5."));
        return;
      }
      var comment = (data.get("comment") || "").toString().trim().slice(0, 500);
      var name = (data.get("name") || "").toString().trim().slice(0, 60);
      var submitBtn = reviewForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      setStatus(statusEl, "loading", t("review.status.sending", "Enviando…"));

      sb.from("reviews")
        .insert({ rating: rating, comment: comment || null, name: name || null, client_token: clientToken() })
        .then(function (res) {
          if (res.error) throw res.error;
          reviewForm.reset();
          setStatus(statusEl, "success", t("review.status.sent", "Obrigado! Sua avaliação foi enviada."));
        })
        .catch(function () {
          setStatus(statusEl, "error", t("review.status.error", "Não foi possível enviar. Tente novamente."));
        })
        .finally(function () {
          submitBtn.disabled = false;
        });
    });
  }

  /* ---- Lista de avaliações aprovadas ---- */
  var reviewsMsg = document.querySelector(".reviews-list-msg");
  var reviewsList = document.querySelector(".reviews-list");
  if (reviewsList) {
    var sbReviews = getClient();
    if (!sbReviews) {
      setStatus(reviewsMsg, "error", t("review.list.error", "Não foi possível carregar as avaliações."));
    } else {
      sbReviews
        .from("reviews")
        .select("rating,comment,name")
        .eq("approved", true)
        .order("created_at", { ascending: false })
        .limit(20)
        .then(function (res) {
          if (res.error) throw res.error;
          var rows = res.data || [];
          if (!rows.length) {
            setStatus(reviewsMsg, "empty", t("review.list.empty", "Ainda não há avaliações aprovadas."));
            return;
          }
          reviewsMsg.hidden = true;
          reviewsList.hidden = false;
          rows.forEach(function (row) {
            var art = document.createElement("article");
            art.className = "review-card";
            var stars = document.createElement("strong");
            stars.textContent = "★".repeat(row.rating) + "☆".repeat(5 - row.rating);
            art.appendChild(stars);
            if (row.comment) {
              var p = document.createElement("p");
              p.textContent = row.comment;
              art.appendChild(p);
            }
            var cite = document.createElement("cite");
            cite.textContent = row.name || t("review.anon", "Visitante");
            art.appendChild(cite);
            reviewsList.appendChild(art);
          });
        })
        .catch(function () {
          setStatus(reviewsMsg, "error", t("review.list.error", "Não foi possível carregar as avaliações."));
        });
    }
  }

  /* ---- Galeria da comunidade ---- */
  var galleryMsg = document.querySelector(".community-gallery-msg");
  var galleryGrid = document.querySelector(".community-gallery-grid");
  if (galleryGrid) {
    var sb = getClient();
    if (!sb) {
      setStatus(galleryMsg, "error", t("community.gallery.error", "Não foi possível carregar as fotos agora."));
    } else {
      sb.from("community_photos")
        .select("id,thumb_path,caption,author_name")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(24)
        .then(function (res) {
          if (res.error) throw res.error;
          var rows = res.data || [];
          if (!rows.length) {
            setStatus(galleryMsg, "empty", t("community.gallery.empty", "Ainda não há fotos aprovadas. Seja o primeiro a compartilhar."));
            return;
          }
          galleryMsg.hidden = true;
          galleryGrid.hidden = false;
          rows.forEach(function (row) {
            var fig = document.createElement("figure");
            fig.className = "community-photo";
            var img = document.createElement("img");
            img.src = publicUrl(sb, BUCKET, row.thumb_path);
            img.loading = "lazy";
            img.decoding = "async";
            img.alt = row.caption || t("community.gallery.altFallback", "Foto enviada pela comunidade");
            fig.appendChild(img);
            if (row.caption || row.author_name) {
              var caption = document.createElement("figcaption");
              caption.textContent = [row.caption, row.author_name].filter(Boolean).join(" · ");
              fig.appendChild(caption);
            }
            galleryGrid.appendChild(fig);
          });
        })
        .catch(function () {
          setStatus(galleryMsg, "error", t("community.gallery.error", "Não foi possível carregar as fotos agora."));
        });
    }
  }

  /* ---- Agenda dinâmica: substitui o conteúdo estático só se o admin já
     publicou algo no painel; sem dados (ou sem Supabase configurado), o
     placeholder fixo do HTML continua valendo. ---- */
  var agendaList = document.querySelector(".agenda-list");
  if (agendaList) {
    var sbAgenda = getClient();
    if (sbAgenda) {
      sbAgenda
        .from("agenda_items")
        .select("title,event_date,description,location")
        .eq("published", true)
        .order("sort_order", { ascending: true })
        .then(function (res) {
          if (res.error) throw res.error;
          var rows = res.data || [];
          if (!rows.length) return;
          agendaList.innerHTML = "";
          rows.forEach(function (row) {
            var art = document.createElement("article");
            art.className = "agenda-item is-visible";
            var dateLabel = row.event_date
              ? new Date(row.event_date + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
              : "";
            art.innerHTML = '<div class="agenda-date"><strong></strong></div><div><h3></h3><p></p></div>';
            art.querySelector(".agenda-date strong").textContent = dateLabel;
            art.querySelector("h3").textContent = row.title;
            art.querySelector("p").textContent = [row.description, row.location].filter(Boolean).join(" · ");
            agendaList.appendChild(art);
          });
        })
        .catch(function () {}); // mantém o placeholder estático em caso de erro
    }
  }

  /* ---- Galeria oficial dinâmica: itens cadastrados no painel são
     anexados aos 16 itens estáticos do HTML e registrados no filtro +
     lightbox existentes (ver window.SATAO_REGISTER_GALLERY_ITEMS em
     main.js). Sem itens publicados, a galeria estática segue intacta. ---- */
  var galleryGridEl = document.querySelector(".gallery-grid");
  if (galleryGridEl) {
    var sbGallery = getClient();
    if (sbGallery) {
      sbGallery
        .from("gallery_items")
        .select("title,category,image_path")
        .eq("published", true)
        .order("sort_order", { ascending: true })
        .then(function (res) {
          if (res.error) throw res.error;
          var rows = res.data || [];
          if (!rows.length) return;
          var figures = rows.map(function (row) {
            var fig = document.createElement("figure");
            fig.className = "gallery-item is-visible";
            fig.setAttribute("data-cat", row.category || "murais");
            fig.innerHTML =
              '<span class="gallery-open"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></span>' +
              '<img loading="lazy" decoding="async" alt="">' +
              "<figcaption></figcaption>";
            var img = fig.querySelector("img");
            img.src = publicUrl(sbGallery, "gallery", row.image_path);
            img.alt = row.title || "";
            fig.querySelector("figcaption").textContent = row.title || "";
            galleryGridEl.appendChild(fig);
            return fig;
          });
          if (typeof window.SATAO_REGISTER_GALLERY_ITEMS === "function") {
            window.SATAO_REGISTER_GALLERY_ITEMS(figures);
          }
        })
        .catch(function () {}); // mantém a galeria estática em caso de erro
    }
  }
})();
