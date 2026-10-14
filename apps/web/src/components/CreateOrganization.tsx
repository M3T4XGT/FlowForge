
import { useState, type FormEvent } from "react";
import axios from "axios";
import { X } from "lucide-react";

import {
  createOrganization,
  type Organization,
} from "../services/api";

interface CreateOrganizationProps {
  onClose: () => void;
  onCreated: (organization: Organization) => void;
}

export default function CreateOrganization({
  onClose,
  onCreated,
}: CreateOrganizationProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleNameChange(value: string) {
    setName(value);

    const generatedSlug = value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    setSlug(generatedSlug);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    setSaving(true);
    setError("");

    try {
      const organization = await createOrganization({
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim(),
      });

      onCreated(organization);
    } catch (err) {
      if (
        axios.isAxiosError(err) &&
        err.response?.status === 409
      ) {
        setError("An organization with this slug already exists.");
      } else {
        setError("Failed to create organization.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-organization-title"
      >
        <div className="modal-header">
          <h2 id="create-organization-title">
            Create Organization
          </h2>

          <button
            type="button"
            className="close-button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form
          className="organization-form"
          onSubmit={handleSubmit}
        >
          <label htmlFor="org-name">Organization Name</label>

          <input
            id="org-name"
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Acme Corporation"
            minLength={2}
            maxLength={150}
            required
          />

          <label htmlFor="org-slug">Organization Slug</label>

          <input
            id="org-slug"
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="acme-corporation"
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            minLength={2}
            required
          />

          <label htmlFor="org-description">Description</label>

          <textarea
            id="org-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your organization"
            maxLength={500}
            rows={4}
          />

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={saving}
            >
              {saving ? "Creating..." : "Create Organization"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
