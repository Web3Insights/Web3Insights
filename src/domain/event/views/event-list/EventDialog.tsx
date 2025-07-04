import { useState, useRef, MouseEvent } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Textarea, Button,
} from "@nextui-org/react";

import FileUpload from "@/components/control/file-upload";

import { insertOne } from "../../repository";

import type { EventDialogPayload, EventDialogProps } from "./typing";
import { resolveContestants } from "./helper";

function EventDialog({ managerId, visible, onClose }: EventDialogProps) {
  const [description, setDescription] = useState("");
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);

  const uploadRef = useRef<HTMLInputElement>(null);

  const handleCsvUpload = (evt: MouseEvent) => {
    evt.preventDefault();
    evt.stopPropagation();
    uploadRef.current?.click();
  };

  const handleFileChange = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setUserInput(e.target?.result as string);

      if (uploadRef.current) {
        uploadRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const closeDialog = (payload?: EventDialogPayload) => {
    setDescription("");
    setUserInput("");
    onClose(payload);
  };

  const handleConfirm = () => {
    const resolvedDescription = description && description.trim();

    if (!resolvedDescription) {
      return alert("Please enter description first.");
    }

    const contestants = resolveContestants(userInput);

    if (contestants.length === 0) {
      return alert("Please enter contestants first.");
    }

    setLoading(true);
    insertOne({ managerId, urls: contestants, description: resolvedDescription })
      .then(res => {
        if (res.success) {
          closeDialog({
            eventId: res.extra!.eventId,
            contestants: res.data,
          });
        } else {
          alert(res.message);
        }
      })
      .finally(() => setLoading(false));
  };

  return (
    <Modal
      backdrop="blur"
      isOpen={visible}
      isDismissable={false}
      isKeyboardDismissDisabled
      classNames={{
        closeButton: "hidden",
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div>Add Event</div>
            </ModalHeader>
            <ModalBody>
              <Textarea
                value={description}
                placeholder="Describe what this event is about"
                label="Description"
                labelPlacement="outside"
                isRequired
                onValueChange={setDescription}
              />
              <Textarea
                value={userInput}
                placeholder="Enter GitHub username of contestants, separated by comma"
                label="Contestants"
                labelPlacement="outside"
                minRows={5}
                maxRows={10}
                isRequired
                onValueChange={setUserInput}
              />
              <div>
                <span className="text-sm">Input manually above or </span>
                <FileUpload
                  ref={uploadRef}
                  type="csv"
                  onChange={handleFileChange}
                >
                  <Button onClick={handleCsvUpload} size="sm">import from CSV file</Button>
                </FileUpload>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="bordered" onClick={() => closeDialog()} isDisabled={loading}>Cancel</Button>
              <Button color="primary" isLoading={loading} onClick={handleConfirm}>Confirm</Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

export default EventDialog;
