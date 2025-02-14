/*
 * Copyright © 2018, VideoLAN and dav1d authors
 * Copyright © 2018, Two Orioles, LLC
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#ifndef __DAV1D_SRC_PICTURE_H__
#define __DAV1D_SRC_PICTURE_H__

#include <stdatomic.h>

#include "src/thread.h"
#include "dav1d/picture.h"

#include "src/thread_data.h"
#include "src/ref.h"

enum PlaneType {
    PLANE_TYPE_Y,
    PLANE_TYPE_UV,
    PLANE_TYPE_BLOCK,
    PLANE_TYPE_ALL,
};

typedef struct Dav1dThreadPicture {
    Dav1dPicture p;
    int visible;
    struct thread_data *t;
    // [0] block data (including segmentation map and motion vectors)
    // [1] pixel data
    atomic_uint *progress;
} Dav1dThreadPicture;

/*
 * Allocate a picture with custom border size.
 */
int dav1d_thread_picture_alloc(Dav1dThreadPicture *p, int w, int h,
                               Dav1dSequenceHeader *seq_hdr, Dav1dRef *seq_hdr_ref,
                               Dav1dFrameHeader *frame_hdr, Dav1dRef *frame_hdr_ref,
                               int bpc, const Dav1dDataProps *props,
                               struct thread_data *t, int visible,
                               Dav1dPicAllocator *);

/**
 * Allocate a picture with identical metadata to an existing picture.
 * The width is a separate argument so this function can be used for
 * super-res, where the width changes, but everything else is the same.
 * For the more typical use case of allocating a new image of the same
 * dimensions, use src->p.w as width.
 */
int dav1d_picture_alloc_copy(Dav1dPicture *dst, const int w,
                             const Dav1dPicture *src);

/**
 * Create a copy of a picture.
 */
void dav1d_picture_ref(Dav1dPicture *dst, const Dav1dPicture *src);
void dav1d_thread_picture_ref(Dav1dThreadPicture *dst,
                              const Dav1dThreadPicture *src);
void dav1d_thread_picture_unref(Dav1dThreadPicture *p);

/**
 * Move a picture reference.
 */
void dav1d_picture_move_ref(Dav1dPicture *dst, Dav1dPicture *src);

/**
 * Wait for picture to reach a certain stage.
 *
 * y is in full-pixel units. If pt is not UV, this is in luma
 * units, else it is in chroma units.
 * plane_type is used to determine how many pixels delay are
 * introduced by loopfilter processes.
 *
 * Returns 0 on success, and 1 if there was an error while decoding p
 */
int dav1d_thread_picture_wait(const Dav1dThreadPicture *p, int y,
                               enum PlaneType plane_type);

/**
 * Signal decoding progress.
 *
 * y is in full-pixel luma units. FRAME_ERROR is used to signal a decoding
 * error to frames using this frame as reference frame.
 * plane_type denotes whether we have completed block data (pass 1;
 * PLANE_TYPE_BLOCK), pixel data (pass 2, PLANE_TYPE_Y) or both (no
 * 2-pass decoding; PLANE_TYPE_ALL).
 */
void dav1d_thread_picture_signal(const Dav1dThreadPicture *p, int y,
                                 enum PlaneType plane_type);

int default_picture_allocator(Dav1dPicture *, void *cookie);
void default_picture_release(Dav1dPicture *, void *cookie);
void dav1d_picture_unref_internal(Dav1dPicture *p);

#endif /* __DAV1D_SRC_PICTURE_H__ */
